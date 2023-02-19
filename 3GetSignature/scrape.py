from csv import writer
from bs4 import BeautifulSoup
import requests
import json
while True:
    try:
        with open("./cursor.json") as f:
            j = json.load(f)
        page = j["cursor"]
        url = "https://www.4byte.directory/signatures"
        formdata = {'sort': 'id', 'page': page}
        page = requests.get(url, formdata)
        soup = BeautifulSoup(page.content, 'html.parser')
        table = soup.find_all('tr')
        cursor_ = soup.find('li', class_="active")
        cursor = cursor_.find('a').text
        with open('signature.csv', 'a', encoding='utf8', newline='') as f:
            myWriter = writer(f)
            # header = ['ID', 'Text Signature', 'Bytes Signature']
            # myWriter.writerow(header)
            for tr in table[1:]:
                id = tr.find('td', class_="id").text
                text_signature = tr.find('td', class_="text_signature").text
                bytes_signature = tr.find('td', class_="bytes_signature").text
                info = [id, text_signature, bytes_signature]
                myWriter.writerow(info)
        with open("./cursor.json", 'w') as f:
            json.dump({"cursor": int(cursor)+1}, f)
        pass
    except Exception as err:
        print(err)
        pass