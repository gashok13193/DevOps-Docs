# import datetime

# now = datetime.datetime.now()

# #print(f"the current time is {now}")

# formatted = now.strftime("%Y-%m-%d %H:%M:%S")

# #print(formatted)

# tomorrow = now + datetime.timedelta(days=1)

# # print(f"Tommorrow's date is {tomorrow}")

# Yesterday = now - datetime.timedelta(days=1)

# # print(f"Yesterday's date is {Yesterday.strftime('%Y-%m-%d')}")

# if Yesterday > now:
#     print("Yesterday is already gone")
# else:
#     print("It is today")
##############################################################


import datetime

timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

log_msg=f"{timestamp} starting deployment \n"

with open("deploy.log", "a") as f:
    f.write(log_msg)
    
print("Log Updated.....")