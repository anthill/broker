#!/bin/sh
for i in `seq $SMS_MESSAGES` ; do
    eval "curl --data \"\${SMS_${i}_TEXT}\" http://0.0.0.0:3000" >> test.txt
done