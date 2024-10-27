import os
from dotenv import load_dotenv
import openai

# 从 .env 文件加载环境变量
load_dotenv()

# 获取 API 密钥
openai.api_key = os.getenv("OPENAI_API_KEY")
print(openai.api_key)
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY 环境变量未设置")