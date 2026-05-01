import subprocess
result = subprocess.run(['ls', '-l'], capture_output=True, text=True)
print(result.stdout)