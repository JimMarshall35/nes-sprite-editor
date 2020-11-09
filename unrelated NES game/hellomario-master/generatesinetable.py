import math

arraylength = int(input("how many bytes "))
magnitude = int(input("magnitude of wave "))

array = []
for i in range(arraylength):
    scaledx = (i/(arraylength-1))* math.pi
    rawsin = math.sin(scaledx)
    scaledsin = rawsin*magnitude
    finalint = round(scaledsin)
    array.append(finalint)

bytearr = bytearray(array)
print("array")
print(array)
    
f = open('sintable.bin', 'wb')
f.write(bytearr)
f.close()

input()
