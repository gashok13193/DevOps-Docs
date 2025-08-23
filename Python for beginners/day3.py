import subprocess

# result=subprocess.run(['ls', '-l'], capture_output=True,text=True)
# print(result.stdout)


# result = subprocess.run('kubectl', 'apply', '-f', 'deployment.yaml', capture_output=True,text=True)
# print(result.stdout)

# exit_code = subprocess.call(['kubectl', 'apply', '-f', 'deployment.yaml'])
# print("Exit code:", exit_code)

# hostname = subprocess.check_output(['hostname'],text=True)

# print(hostname)


subprocess.check_call(['ls', '/ashok'])