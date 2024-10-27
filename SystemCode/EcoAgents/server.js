const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { exec } = require('child_process');
const { start } = require('repl');
const app = express();
const PORT = 3000;
const fsp = require('fs').promises;

// 用于存储全局的 simulation 参数
let globalSimulationParams = {};
let simulationDetails = {};
let simulationStatus = 'idle';

app.use(express.json());
app.use(express.static('public'));

function parseWorldCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                results.push({
                    month: parseInt(data.Month),
                    price: parseFloat(data.Price),
                    products: parseFloat(data['#Products']),
                    interestRate: parseFloat(data['Interest Rate']) || 0,
                    unemploymentRate: parseFloat(data['Unemployment Rate']) || 0,
                    realGDP: parseFloat(data['Real GDP']) || 0,
                    nominalGDP: parseFloat(data['Nominal GDP']) || 0,
                    priceInflation: parseFloat(data['Price Inflation']) || 0,
                    unemploymentGrowth: parseFloat(data['Unemployment Rate Growth']) || 0,
                    wageInflation: parseFloat(data['Wage Inflation']) || 0,
                    nominalGDPGrowth: parseFloat(data['Nominal GDP Growth']) || 0,
                    realGDPGrowth: parseFloat(data['Real GDP Growth']) || 0,
                });
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}
async function parseClustersData(filePath) {
    try {
        // 使用 fs.promises 读取文件内容
        const data = await fsp.readFile(filePath, { encoding: 'utf8' });

        // 按行分割文件内容，手动解析每行数据
        const clusters = data.split('\n')
            .filter(line => line.trim() !== '') // 过滤掉空行
            .map(line => {
                // 去掉行首和行尾的方括号和空格
                const trimmedLine = line.trim().replace(/^\[|\]$/g, '').trim();
                
                // 将内容按逗号分割，保留原始单引号
                const items = trimmedLine.split(',').map(item => item.trim());

                const parsedItems = items.map(item => item.replace(/^['"]|['"]$/g, ''));

                return parsedItems; // 返回解析后的数组
            });

        return clusters;
    } catch (error) {
        throw new Error(`Error reading or parsing cluster data: ${error.message}`);
    }
}

// 创建 '/clusters' 路由来读取并返回聚类数据
app.get('/clusters', async (req, res) => {
    try {
        // 使用固定的文件路径
        const startYear = globalSimulationParams.startYear;
        const txtFilePath = path.join(__dirname, 'SimModel/data', `clustered_profiles_us_${startYear}.txt`);
        
        console.log('Trying to read file from:', txtFilePath); // 添加日志确认路径

        // 使用 parseClustersData 读取并解析文件内容
        const clusters = await parseClustersData(txtFilePath);

        // 返回解析后的数据给前端
        res.json(clusters);
    } catch (error) {
        console.error('Error reading cluster data:', error);
        res.status(500).send('读取聚类数据时出错');
    }
});

app.get('/world-data', async (req, res) => {
    const { numAgents, episodeLength } = globalSimulationParams;
    const folderName = `gpt-3-noperception-reflection-1-${numAgents}agents-${episodeLength}months`;
    const worldFilePath = path.join(__dirname, `SimModel/data/${folderName}/world.csv`);

    try {
        const worldData = await parseWorldCSV(worldFilePath);
        res.json(worldData);
    } catch (error) {
        console.error('Error reading world.csv:', error);
        res.status(500).json({ message: 'Error reading world.csv' });
    }
});

// 读取并解析 states.csv 文件
function parseStatesCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = {};
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const agentId = data.Agent_ID;
                const endogenous = JSON.parse(data.Endogenous.replace(/""/g, '"'));

                results[agentId] = {
                    name: endogenous.name,
                    age: endogenous.age,
                    city: endogenous.city,
                    education: endogenous.education,
                    job: endogenous.job,
                    previous_job: endogenous.previous_job,
                    offer: endogenous.offer
                };
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

// 读取并解析 Agents 基础信息及月度记录
function parseAgentsData(filePath) {
    return new Promise((resolve, reject) => {
        const agentsData = {};

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const agentId = data.Agent_ID;
                if (!agentsData[agentId]) {
                    agentsData[agentId] = {
                        info: {},
                        records: []
                    };
                }

                if (parseInt(data.Month) === 0) {
                    // 处理第0月的基础信息
                    try {
                        const endogenous = JSON.parse(data.Endogenous.replace(/""/g, '"'));
                        agentsData[agentId].info = {
                            name: endogenous.name || 'Unknown',
                            age: endogenous.age || 'Unknown',
                            city: endogenous.city || 'Unknown',
                            education: endogenous.education || 'Unknown',
                            job: endogenous.job || 'Unknown',
                            previous_job: endogenous.previous_job || 'Unknown',
                            offer: endogenous.offer || 'Unknown'
                        };
                    } catch (error) {
                        console.error(`Error parsing Endogenous for Agent ${agentId}: ${error.message}`);
                        agentsData[agentId].info = {
                            name: 'Unknown',
                            age: 'Unknown',
                            city: 'Unknown',
                            education: 'Unknown'
                        };
                    }
                } else {
                    // 记录该代理的月度数据
                    agentsData[agentId].records.push({
                        month: parseInt(data.Month),
                        income: parseFloat(data.Income_Coin) || 0,
                        tax_paid: parseFloat(data.tax_paid) || 0,
                        marginal_rate: parseFloat(data.marginal_rate) || 0,
                        effective_rate: parseFloat(data.effective_rate) || 0,
                        lump_sum: parseFloat(data.lump_sum) || 0,
                        Inventory_Coin: parseFloat(data.Inventory_Coin) || 0,
                        Inventory_Products: parseFloat(data.Inventory_Products) || 0,
                        Consumption_Coin: parseFloat(data.Consumption_Coin) || 0,
                        Consumption_Products: parseFloat(data.Consumption_Products) || 0
                    });
                }
            })
            .on('end', () => resolve(agentsData))
            .on('error', (err) => reject(err));
    });
}




// 读取并解析 PeriodicTax.csv 文件
function parsePeriodicTaxCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = {};
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                Object.keys(data).forEach((key) => {
                    if (key.startsWith('Agent_')) {
                        const agentId = key.split('_')[1];
                        const agentData = JSON.parse(data[key].replace(/""/g, '"'));

                        if (!results[agentId]) {
                            results[agentId] = [];
                        }

                        results[agentId].push({
                            month: parseInt(data.Month),
                            income: agentData.income || 0,
                            tax_paid: agentData.tax_paid || 0,
                            marginal_rate: agentData.marginal_rate || 0,
                            effective_rate: agentData.effective_rate || 0,
                            lump_sum: agentData.lump_sum || 0,
                            cutoffs: data.Cutoffs || 0, // Cutoffs rounded to two decimals
                            schedule: data.Schedule || 0
                        });
                    }
                });
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

// 动态获取代理信息及财务记录，并返回 episodeLength
app.get('/agents', async (req, res) => {
    const { numAgents, episodeLength } = globalSimulationParams;  // 从全局变量中获取
    const folderName = `gpt-3-noperception-reflection-1-${numAgents}agents-${episodeLength}months`;

    try {
        const statesFilePath = `SimModel/data/${folderName}/states.csv`;
        const periodicTaxFilePath = `SimModel/data/${folderName}/PeriodicTax.csv`;

        const statesData = await parseStatesCSV(statesFilePath);
        const taxData = await parsePeriodicTaxCSV(periodicTaxFilePath);

        const combinedResults = {};
        Object.keys(statesData).forEach((agentId) => {
            combinedResults[statesData[agentId].name] = {
                info: statesData[agentId],
                records: taxData[agentId]
            };
        });

        // 返回代理数据并包括 episodeLength
        res.json({ agents: combinedResults, episodeLength });
    } catch (error) {
        console.error('Error reading CSV files:', error);
        res.status(500).send('Error reading CSV files');
    }
});

// 动态获取单个代理信息
app.get('/agent/:name', async (req, res) => {
    const { numAgents, episodeLength } = globalSimulationParams;  // 动态从全局变量中获取参数
    const agentName = req.params.name;
    const folderName = `gpt-3-noperception-reflection-1-${numAgents}agents-${episodeLength}months`;

    try {
        const statesFilePath = `SimModel/data/${folderName}/states.csv`;
        const periodicTaxFilePath = `SimModel/data/${folderName}/PeriodicTax.csv`;

        const statesData = await parseStatesCSV(statesFilePath);
        const taxData = await parsePeriodicTaxCSV(periodicTaxFilePath);

        let foundAgentId = null;
        Object.keys(statesData).forEach((agentId) => {
            if (statesData[agentId].name === agentName) {
                foundAgentId = agentId;
            }
        });

        if (foundAgentId) {
            const agentInfo = statesData[foundAgentId];
            const agentRecords = taxData[foundAgentId];
            res.json({ info: agentInfo, records: agentRecords });
        } else {
            res.status(404).send('Could not find agent with that name');
        }
    } catch (error) {
        console.error(`Error retrieving agent data for ${agentName}:`, error);
        res.status(500).send('Error retrieving agent data');
    }
});

// 动态读取 agent-records
app.get('/agent-records', async (req, res) => {
    const { numAgents, episodeLength } = globalSimulationParams;  // 从全局变量中获取动态参数
    const folderName = `gpt-3-noperception-reflection-1-${numAgents}agents-${episodeLength}months`;

    try {
        const csvFilePath = `SimModel/data/${folderName}/states.csv`;
        const agentsData = await parseAgentsData(csvFilePath);

        res.json(agentsData);
    } catch (error) {
        console.error('Error reading agent data:', error);
        res.status(500).send('Error reading agent data');
    }
});

function folderExists(folderPath) {
    try {
        return fs.statSync(folderPath).isDirectory();
    } catch (err) {
        return false;
    }
}

// 删除文件夹及其内容的函数
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // 递归删除子文件夹
                deleteFolderRecursive(curPath);
            } else {
                // 删除文件
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

// 处理模拟请求
app.post('/start-simulation', (req, res) => {
    const { numAgents, episodeLength, city, startYear } = req.body;
    const force = req.body.force || false;
    console.log('Received simulation request with parameters:');
    console.log('numAgents:', numAgents);
    console.log('episodeLength:', episodeLength);
    console.log('city:', city);
    console.log('startYear:', startYear);

    globalSimulationParams = { numAgents, episodeLength, city, startYear };
    simulationDetails = { numAgents, episodeLength, city, startYear };

    const folderName = `gpt-3-noperception-reflection-1-${numAgents}agents-${episodeLength}months`;
    const folderPath = path.join(__dirname, 'SimModel/data', folderName);

    if (folderExists(folderPath)) {
        // 文件夹已存在，询问用户是否重新生成
        if (force === true) {
            // 用户选择重新生成，相当于执行重置
            console.log('User chose to regenerate. Resetting simulation data...');
            // 删除已有的文件夹
            deleteFolderRecursive(folderPath);
            // 清空全局参数和状态
            globalSimulationParams = { numAgents, episodeLength, city, startYear };
            simulationDetails = { numAgents, episodeLength, city, startYear };
            simulationStatus = 'idle'; // 重置模拟状态
            // 继续执行，开始新的模拟
        } else {
            // 用户未选择重新生成，返回状态，让前端询问用户
            console.log('Folder already exists, asking for regeneration.');
            res.json({ status: 'exists', message: 'Simulation folder exists. Do you want to regenerate?' });
            return;
        }
    }

    // 设置模拟状态为 running
    simulationStatus = 'running';

    // 立即响应，告诉前端模拟已开始
    res.json({ status: 'started', message: 'Simulation started.' });

    // 开始模拟
    console.log('Starting simulation...');
    const simulateCommand = `python simulate.py --policy_model gpt --num_agents ${numAgents} --episode_length ${episodeLength} --city "${city}" --year ${startYear}`;
    const pkl2csvCommand = `python pkl2csv.py --policy_model gpt --num_agents ${numAgents} --episode_length ${episodeLength} --city "${city}" --year ${startYear}`;
    const options = { cwd: path.join(__dirname, 'SimModel') };

    // 执行 simulateCommand
    exec(simulateCommand, options, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing simulate.py: ${error.message}`);
            simulationStatus = 'error';
            return;
        }
        console.log(`simulate.py output: ${stdout}`);

        // 执行 pkl2csvCommand
        exec(pkl2csvCommand, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing pkl2csv.py: ${error.message}`);
                simulationStatus = 'error';
                return;
            }
            console.log(`pkl2csv.py output: ${stdout}`);

            // 模拟完成，更新状态
            simulationStatus = 'success';
        });
    });
});

// 检查模拟状态
app.get('/check-simulation', (req, res) => {
    res.json({ status: simulationStatus });
});

// 重置模拟
app.post('/reset-simulation', (req, res) => {
    const { numAgents, episodeLength } = globalSimulationParams;
    if (!numAgents || !episodeLength) {
        return res.json({ status: 'error', message: 'No simulation data to reset.' });
    }

    const folderName = `gpt-3-noperception-reflection-1-${numAgents}agents-${episodeLength}months`;
    const folderPath = path.join(__dirname, 'SimModel/data', folderName);

    if (folderExists(folderPath)) {
        // 删除已有的文件夹
        console.log('Deleting simulation data folder...');
        deleteFolderRecursive(folderPath);
        // 清空全局参数和状态
        globalSimulationParams = {};
        simulationDetails = {};
        simulationStatus = 'idle';
        res.json({ status: 'success', message: 'Simulation data has been reset.' });
    } else {
        res.json({ status: 'error', message: 'Simulation data folder does not exist.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
