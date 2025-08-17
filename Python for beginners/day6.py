import requests

repo = "gashok13193/DevOps-Docs"
url = f"https://api.github.com/repos/{repo}"

response=requests.get(url)
# print(response)

data = response.json()
# print(data)

if response.status_code == 200:
    print(f"Repo: {data['name']}")
    print(f"Fork: {data['forks_count']}")
    print(f"Network: {data['network_count']}")