const co = require('co');
const xtpl = require('xtpl');
const fs = require('fs');
const thunkify = require('thunkify');
const path = require('path');
const prettier = require('prettier');
const { NodeVM } = require('vm2');
const _ = require('lodash');
const data = require('./data');

const vm = new NodeVM({
  console: 'inherit',
  sandbox: {}
});

co(function*() {
  const xtplRender = thunkify(xtpl.render);
  const code = fs.readFileSync(path.resolve(__dirname, '../src/index.js'), 'utf8');
  const renderInfo = vm.run(code)(data, {
    prettier: prettier,
    _: _,
    responsive: {
      width: 750,
      viewportWidth: 375
    },
    utils: {
      print: function(value) {
        console.log(value);
      }
    }
  });

  // 检查文件夹是否存在
  const folderCode = path.join(__dirname, '../code/');
  if (!fs.existsSync(folderCode)) {
    fs.mkdirSync(folderCode);
  }

  if (renderInfo.noTemplate) {
    renderInfo.panelDisplay.forEach((file) => {
      fs.writeFileSync( `${folderCode}${file.panelName}`, file.panelValue);
    });
  } else {
    const renderData = renderInfo.renderData;
    const ret = yield xtplRender(path.resolve(__dirname, '../src/template.xtpl'), renderData, {});

    const prettierOpt = renderInfo.prettierOpt || {
      parser: 'vue',
      printWidth: 120,
      tabWidth: 4,
      semi: true,
      singleQuote: true,
      trailingComma: 'none',
      bracketSpacing: true,
      jsxBracketSameLine: true,
      arrowParens: 'avoid',
      requirePragma: false,
      proseWrap: 'preserve',
      endOfLine: 'auto',
      htmlWhitespaceSensitivity: "ignore"
    };

    const prettierRes = prettier.format(ret, prettierOpt);

    fs.writeFileSync(path.join(__dirname, '../code/result.vue'), prettierRes);
  }
});
