# Miscellaneous

## Audit script

script that crawls through raw EDS html versions of page for OST links and spits out a CSV report
 
 for one page or two or more 
 `node audit.mjs https://www.adobe.com/page1.html https://www.adobe.com/page2.html`
 
 for a sitemap or more
 `node audit.mjs https://www.adobe.com/cc-shared/assets/sitemap.xml`
 
 either case output will be entered as csv in /tmp/audit.csv, you can set a different output file with -f parameter

 for a full configured set of URLs and/or sitemap you can use -m parameter with a manifest composed of URLs/Sitemap separated by new lines character
 
 for faster execution, buffer size (number of parallel page being audited) can be increased but will impact your connection with parameter -b (you can move it lower to the default that is 100).
 
 so typical execution could be 
 `node audit.mjs -b 50 -f ~/Documents/audit.csv -m ./audit-manifest.txt`