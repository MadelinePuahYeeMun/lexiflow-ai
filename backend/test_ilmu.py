from openai import OpenAI

client = OpenAI(
    api_key="sk-6e71751120bb64c78227833c516269ab8c1d3f9ec83aa1a8",
    base_url="https://api.ilmu.ai/v1",
)

response = client.chat.completions.create(
    model="ilmu-glm-5.1",
    messages=[
        {
            "role": "user",
            "content": "Reply with exactly this word only: SUCCESS"
        }
    ],
    temperature=0
)

print(response.choices[0].message.content)