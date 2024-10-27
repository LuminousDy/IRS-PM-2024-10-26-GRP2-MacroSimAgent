# MacroSimAgent: Macroeconomics Simulation Agent

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/LuminousDy/IRS-PM-2024-10-26-GRP2-MacroSimAgent/tree/main/SystemCode/EcoAgents)

## Project Title
MacroSimAgent - IRS-PM-2024-10-26-GRP2-MacroSimAgent

## Executive Summary
MacroSimAgent is a sophisticated multi-agent simulation platform designed to model macroeconomic environments by integrating advanced AI techniques such as Large Language Models (LLMs), Chain of Thought (CoT) prompting, and Graph Attention Networks (GATs). The platform aims to provide realistic simulations of economic behaviors, including labor market dynamics, consumption trends, and the impact of policies on macroeconomic indicators. Through an intuitive user interface and a robust backend, MacroSimAgent supports macro- and micro-level economic analyses for research, policy development, and educational purposes.

## Project Objectives
The main goal of MacroSimAgent is to improve macroeconomic simulation accuracy and user experience. Key objectives include:
1. **User-Friendly Interface**: Create an intuitive platform for configuring simulations, visualizing economic interactions, and analyzing results.
2. **Realistic Economic Modeling**: Enhance agent reasoning and decision-making processes using CoT and LLMs to simulate realistic economic behaviors.
3. **Comprehensive Data Visualization**: Provide visualizations of macroeconomic indicators (e.g., GDP, inflation) and microeconomic interactions (e.g., income changes, career transitions).
4. **Advanced Agent Interactions**: Model complex social and career interactions using GATs and adaptive decision-making frameworks.

## System Architecture
MacroSimAgent’s architecture is structured into three main components:

1. **User Interface (UI)**: The web-based interface enables users to configure simulation parameters (e.g., number of agents, duration, location) and visualize the results. The UI consists of multiple pages for:
   - **World Data Visualization**: Displays macro-level indicators like GDP growth.
   - **Agent Income Dashboard**: Shows economic metrics such as real vs. nominal GDP and inflation.
   - **Agents Data Visualization**: Illustrates individual agent behaviors.
   - **Occupation Clusters**: Analyzes job transition patterns.
2. **Frontend Server**: Communicates with the backend to send parameters, process results, and prepare data for display.
3. **Backend Server**: Executes simulations, generates results in CSV format, and processes agent behaviors to simulate macro- and micro-level interactions.

## Core Modules
### 1. Agent Profile Module
   - Expands agent profiles with demographic (age, education, city) and economic attributes (income, savings).
   - Simulates realistic economic behaviors by considering dynamic factors such as career progression.
   
### 2. Agent Memory Module
   - Maintains economic history and uses CoT prompting to enhance decision-making.
   - Adapts prompts based on past experiences to simulate realistic behavior patterns.

### 3. Agent Action Module
   - Models decisions such as consumption and career changes using adaptive LLMs.
   - Considers economic conditions, agent profiles, and historical data.

### 4. Social Interaction Modeling
   - Uses GATs for career transition simulation, considering relationships between occupations.
   - Enhances realism by accounting for cross-salary movements and inter-occupational correlations.

## Installation
To set up the MacroSimAgent project:
1. **Clone the repository**:
git clone https://github.com/LuminousDy/IRS-PM-2024-10-26-GRP2-MacroSimAgent.git
2. **Navigate to the EcoAgents directory**:
cd IRS-PM-2024-10-26-GRP2-MacroSimAgent/SystemCode/EcoAgents
3. **Install dependencies**:
npm install # For Node.js dependencies pip install -r requirements.txt # For Python dependencies

## Usage
1. **Run the Backend Simulation**:
python SimModel/ai_economist/main.py
2. **Start the Frontend Server**:
npm start
3. **Access the Web Interface**:
- Open a browser and navigate to `http://localhost:3000` to configure and start simulations.

## Solution Implementation
- **User Interface Design**: Includes multiple pages for exploring macroeconomic changes, setting up simulations, and viewing detailed agent data.
- **Backend Processing**: Uses multi-agent models to simulate economic variables and generate CSV outputs for analysis.

## Future Plans
1. **Data Enhancement**: Expand the range and quality of data sources.
2. **Scalability Improvements**: Optimize the system to handle larger simulations and real-time processing.
3. **Advanced Modeling**: Introduce reinforcement learning and additional social factors for agent decision-making.

## Contributors
- **Din Yi (A0295756J)**
- **Yang Runzhi (A0297296H)**
- **Lou Shengxin (A0397330A)**
- **Shi Haocheng (A0296265R)**
- **Liu Lihao (A0296992A)**

## License
This project is licensed under the Apache-2.0 license.
