import pandas as pd

df = pd.read_csv('signature.csv')
# print(df)
df1 = df[df['Text Signature'].str.contains("transfer")]
df2 = df[df['Text Signature'].str.contains("Transfer")]
df3 = df[df['Text Signature'].str.contains("swap")]
df4 = df[df['Text Signature'].str.contains("Swap")]
df5 = df[df['Text Signature'].str.contains("approve")]
df6 = df[df['Text Signature'].str.contains("Approve")]
df7 = df[df['Text Signature'].str.contains("deposit")]
df8 = df[df['Text Signature'].str.contains("Deposit")]

df_black = pd.concat([df1, df2, df3, df4, df5, df6, df7, df8])
# blacklist = df_black[['Text Signature','Bytes Signature']]
blacklist = df_black['Bytes Signature']
print(blacklist)

blacklist.to_csv('blacklist_.csv', index=False)

df3 = df[df['Text Signature'].str.contains("mint")]
df4 = df[df['Text Signature'].str.contains("Mint")]
df_white = pd.concat([df3, df4])
whitelist = df_white[['Text Signature', 'Bytes Signature']]
print(whitelist)
# whitelist.to_csv('whitelist_.csv',index=False)