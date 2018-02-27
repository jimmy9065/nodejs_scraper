# web crawler for enterprise relationship using Baidu search engine  

## Instruction:  

1. Run 'npm install' to install all the dependency.
2. start the crawler by running 'node index.js'.
3. The crawler will record the result in the graph file during the crawling.
4. Push Enter will stop the crawling and make a snapshot of the current process in candidate file and visited file.
5. As long as the candidate file and visited file and both exist and intact, the crawler will continue crawling by just running 'node index.js'.
6. The crawler will start from '销售易' by default. If you want to set custom start point. You can just create the candidate file and write your start points in that file.
7. For windows user, the candidate file, graph file, and visited file are all plaintext file. You can just add .txt to the filename to read.
