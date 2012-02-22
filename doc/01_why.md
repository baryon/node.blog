#为什么要选择node.js#	

###1.目的###	
aaaa
aaaa
 
###2.方案选择###	 
啊啊啊啊

###3.操作步骤###	   
啊啊啊

###4.思考和讨论###	 
啊啊啊

$ ab -n 100 -c 1 http://127.0.0.1:3000/
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient).....done


Server Software:        
Server Hostname:        127.0.0.1
Server Port:            3000

Document Path:          /
Document Length:        2816 bytes

Concurrency Level:      1
Time taken for tests:   0.644 seconds
Complete requests:      100
Failed requests:        0
Write errors:           0
Total transferred:      309268 bytes
HTML transferred:       281600 bytes
Requests per second:    155.31 [#/sec] (mean)
Time per request:       6.439 [ms] (mean)
Time per request:       6.439 [ms] (mean, across all concurrent requests)
Transfer rate:          469.08 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.0      0       0
Processing:     4    6   2.5      6      19
Waiting:        4    6   2.4      6      19
Total:          4    6   2.5      6      19

Percentage of the requests served within a certain time (ms)
  50%      6
  66%      6
  75%      6
  80%      7
  90%      8
  95%     12
  98%     17
  99%     19
 100%     19 (longest request)
 
 

$ ab -n 100 -c 1 http://127.0.0.1:8888/
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient).....done


Server Software:        TornadoServer/1.1
Server Hostname:        127.0.0.1
Server Port:            8888

Document Path:          /
Document Length:        2815 bytes

Concurrency Level:      1
Time taken for tests:   0.472 seconds
Complete requests:      100
Failed requests:        22
   (Connect: 0, Receive: 0, Length: 22, Exceptions: 0)
Write errors:           0
Non-2xx responses:      22
Total transferred:      236690 bytes
HTML transferred:       221616 bytes
Requests per second:    211.91 [#/sec] (mean)
Time per request:       4.719 [ms] (mean)
Time per request:       4.719 [ms] (mean, across all concurrent requests)
Transfer rate:          489.82 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0       2
Processing:     2    5  10.6      3     106
Waiting:        2    4  10.6      3     106
Total:          2    5  10.6      3     106

Percentage of the requests served within a certain time (ms)
  50%      3
  66%      3
  75%      4
  80%      4
  90%      4
  95%     13
  98%     24
  99%    106
 100%    106 (longest request)
$ 





$ ab -n 100 -c 100 http://127.0.0.1:3000/
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient).....done


Server Software:        
Server Hostname:        127.0.0.1
Server Port:            3000

Document Path:          /
Document Length:        2816 bytes

Concurrency Level:      100
Time taken for tests:   0.621 seconds
Complete requests:      100
Failed requests:        0
Write errors:           0
Total transferred:      309252 bytes
HTML transferred:       281600 bytes
Requests per second:    160.96 [#/sec] (mean)
Time per request:       621.289 [ms] (mean)
Time per request:       6.213 [ms] (mean, across all concurrent requests)
Transfer rate:          486.09 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        2    3   0.8      3       4
Processing:   613  614   0.7    615     616
Waiting:      597  605   4.9    605     613
Total:        617  617   0.2    617     618
WARNING: The median and mean for the processing time are not within a normal deviation
        These results are probably not that reliable.

Percentage of the requests served within a certain time (ms)
  50%    617
  66%    617
  75%    617
  80%    618
  90%    618
  95%    618
  98%    618
  99%    618
 100%    618 (longest request)
$ ab -n 100 -c 100 http://127.0.0.1:8888/
This is ApacheBench, Version 2.3 <$Revision: 655654 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 127.0.0.1 (be patient).....done


Server Software:        TornadoServer/1.1
Server Hostname:        127.0.0.1
Server Port:            8888

Document Path:          /
Document Length:        2815 bytes

Concurrency Level:      100
Time taken for tests:   0.323 seconds
Complete requests:      100
Failed requests:        5
   (Connect: 0, Receive: 0, Length: 5, Exceptions: 0)
Write errors:           0
Non-2xx responses:      5
Total transferred:      283525 bytes
HTML transferred:       267890 bytes
Requests per second:    309.14 [#/sec] (mean)
Time per request:       323.473 [ms] (mean)
Time per request:       3.235 [ms] (mean, across all concurrent requests)
Transfer rate:          855.96 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        1    3   0.8      3       4
Processing:   307  312   3.7    312     319
Waiting:      307  312   3.7    312     319
Total:        310  315   3.9    314     322

Percentage of the requests served within a certain time (ms)
  50%    314
  66%    316
  75%    320
  80%    321
  90%    322
  95%    322
  98%    322
  99%    322
 100%    322 (longest request)
$ 
