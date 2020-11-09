import tkinter as tk
from tkinter import filedialog
import array

# changes a 30*32 nametable (rows, columns)
# to a 32*30 nametablke (columns, rows)
root = tk.Tk()
root.withdraw()

file_path = filedialog.askopenfilename()
print(file_path)
output = []

_bytes = open(file_path, "rb").read()
print("input: \n"+str(_bytes)+"\n")
print("input file length (bytes): "+str(len(_bytes))+"\n")
for i in range(32):
    for j in range(30):
        index = i+(j*32)
        thisbyte = _bytes[index]
        output.append(thisbyte)

output = bytearray(output)
print("output: \n"+str(output)+"\n")
print("output file length (bytes): "+str(len(output)))

outputpath = file_path[:-4] + "_formatted.bin"
print("\nsaved as "+outputpath)
f = open(outputpath, 'wb')
f.write(output)
f.close()

input()
