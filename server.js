// kakaka.cn 纪念版：只提供 public/ 下的静态文件，不连任何数据库。
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log('kakaka memorial site listening on port ' + PORT);
});
