# this is a modified combination of code from 
# https://stackoverflow.com/questions/2957116/make-2-functions-run-at-the-same-time
# https://www.instructables.com/Raspberry-Pi-LED-Blink/
# https://wiki.python.org/moin/UdpCommunication
# https://raspberrypi.stackexchange.com/questions/53778/how-to-detect-state-of-gpio-pin-in-python

from threading import Thread
from time import sleep     # Import the sleep function from the time module
import socket
import RPi.GPIO as GPIO

UDP_TX_IP = "127.0.0.1"
UDP_TX_PORT = 3000

UDP_RX_IP = "127.0.0.1"
UDP_RX_PORT = 3001


print("UDP target IP: %s" % UDP_TX_IP)
print("UDP target port: %s" % UDP_TX_PORT)

sockTX = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) 
sockRX = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP
sockRX.bind((UDP_RX_IP, UDP_RX_PORT))

# set up GPIO pins
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

GPIO.setup(26,GPIO.OUT) 
GPIO.output(26,GPIO.LOW)
GPIO.setup(20,GPIO.OUT) 
GPIO.output(20,GPIO.LOW)
GPIO.setup(21,GPIO.OUT) 
GPIO.output(21,GPIO.HIGH)
GPIO.setup(16,GPIO.OUT) 
GPIO.output(16,GPIO.HIGH)

def newclient():
     if GPIO.input(26):
          sockTX.sendto(bytes('{"GPIO26T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
     if GPIO.input(20):
          sockTX.sendto(bytes('{"GPIO20T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
     if GPIO.input(21):
          sockTX.sendto(bytes('{"GPIO21T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
     if GPIO.input(16):
          sockTX.sendto(bytes('{"GPIO16T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))

def one():
     while True: # Run forever
          MESSAGE = '{"D22":1}'
          #print("transmit message: ", MESSAGE)
          sockTX.sendto(bytes('{"A1":80}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
          sleep(3)                  # Sleep for 1 second
          #MESSAGE = '{"D22":0}'
          #print("transmit message: ", MESSAGE)
          #sockTX.sendto(bytes(MESSAGE, "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
          sockTX.sendto(bytes('{"A1":20}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
          sleep(3)                  # Sleep for 1 second
               
def two():
     while True:
          data, addr = sockRX.recvfrom(1024) # buffer size is 1024 bytes
          JsonStr = data.decode('utf_8')
          print(JsonStr)
          if (JsonStr.find('{"NewClient":1}') != -1):
               newclient()     
          elif (JsonStr.find('{"GPIO26T":1}') != -1):
               if GPIO.input(26):
                  GPIO.output(26,GPIO.LOW)
                  sockTX.sendto(bytes('{"GPIO26T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
               else:
                  GPIO.output(26,GPIO.HIGH)  
                  sockTX.sendto(bytes('{"GPIO26T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
          elif (JsonStr.find('{"GPIO20T":1}') != -1):
               if GPIO.input(20):
                  GPIO.output(20,GPIO.LOW)
                  sockTX.sendto(bytes('{"GPIO20T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
               else:
                  GPIO.output(20,GPIO.HIGH)  
                  sockTX.sendto(bytes('{"GPIO20T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
          elif (JsonStr.find('{"GPIO21T":1}') != -1):
               if GPIO.input(21):
                  GPIO.output(21,GPIO.LOW)
                  sockTX.sendto(bytes('{"GPIO21T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
               else:
                  GPIO.output(21,GPIO.HIGH)  
                  sockTX.sendto(bytes('{"GPIO21T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
          elif (JsonStr.find('{"GPIO16T":1}') != -1):
               if GPIO.input(16):
                  GPIO.output(16,GPIO.LOW)
                  sockTX.sendto(bytes('{"GPIO16T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
               else:
                  GPIO.output(16,GPIO.HIGH)  
                  sockTX.sendto(bytes('{"GPIO16T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
          elif (JsonStr.find('{"GPIO26M":1}') != -1):
                  sockTX.sendto(bytes('{"GPIO26T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(26,GPIO.HIGH)  
          elif (JsonStr.find('{"GPIO20M":1}') != -1):
                  sockTX.sendto(bytes('{"GPIO20T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(20,GPIO.HIGH)  
          elif (JsonStr.find('{"GPIO21M":1}') != -1):
                  sockTX.sendto(bytes('{"GPIO21T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(21,GPIO.HIGH)  
          elif (JsonStr.find('{"GPIO16M":1}') != -1):
                  sockTX.sendto(bytes('{"GPIO16T":1}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(16,GPIO.HIGH)  
          elif (JsonStr.find('{"GPIO26M":0}') != -1):
                  sockTX.sendto(bytes('{"GPIO26T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(26,GPIO.LOW)  
          elif (JsonStr.find('{"GPIO20M":0}') != -1):
                  sockTX.sendto(bytes('{"GPIO20T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(20,GPIO.LOW)  
          elif (JsonStr.find('{"GPIO21M":0}') != -1):
                  sockTX.sendto(bytes('{"GPIO21T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(21,GPIO.LOW)  
          elif (JsonStr.find('{"GPIO16M":0}') != -1):
                  sockTX.sendto(bytes('{"GPIO16T":0}', "utf-8"), (UDP_TX_IP, UDP_TX_PORT))
                  GPIO.output(16,GPIO.LOW)  

newclient()
p1 = Thread(target = one)
p2 = Thread(target = two)

p1.start()
p2.start()


#If you leave leave following the code out, Ctrl-C to terminate the program may not work.
while True:  
     # Run your main code here.  
     sleep(10)

