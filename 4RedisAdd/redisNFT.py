import redis  # 导入redis 模块
import csv

pool = redis.ConnectionPool(
    host='',
    port=6379,
    db=3,
    decode_responses=True,
    password='')
r = redis.Redis(connection_pool=pool)

with open('signature.csv', 'r') as f:
    reader = csv.reader(f)

    for row in reader:
        print(f"current index is {row[0]}")
        r.rpush(row[2], row[1])  # key:bytes value:text
