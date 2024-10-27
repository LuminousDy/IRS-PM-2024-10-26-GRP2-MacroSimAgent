import json

# 读取 profiles.json 文件
with open('data/profiles.json', 'r') as file:
    profiles = json.load(file)

# 提取所有工作类别
all_jobs = []
for key, value in profiles.items():
    if isinstance(value, list) and key != "City":
        all_jobs.extend(value)

# 将工作分组
job_groups = []
current_group = []
for job in all_jobs:
    current_group.append(job)
    if len(current_group) == 3 or job == all_jobs[-1]:
        job_groups.append(current_group)
        current_group = []

# 将分组后的工作写入 dummy_profiles.txt 文件
with open('data/dummy_profiles.txt', 'w') as file:
    for group in job_groups:
        file.write(json.dumps(group) + '\n')

print("转换完成，请查看 data/dummy_profiles.txt 文件。")
