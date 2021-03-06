# Docx-templates [![Build Status](https://travis-ci.org/guigrpa/docx-templates.svg)](https://travis-ci.org/guigrpa/docx-templates) [![Coverage Status](https://coveralls.io/repos/github/guigrpa/docx-templates/badge.svg?branch=master)](https://coveralls.io/github/guigrpa/docx-templates?branch=master) [![npm version](https://img.shields.io/npm/v/docx-templates.svg)](https://www.npmjs.com/package/docx-templates)

Template-based docx report creation for both Node and the browser. ([See the blog post](http://guigrpa.github.io/2017/01/01/word-docs-the-relay-way/)).

## Why?

* **Write documents naturally using Word**, just adding some commands where needed for dynamic contents
* **Express your data needs (queries) in the template itself** (`QUERY` command), in whatever query language you want (e.g. in GraphQL). This is similar to _the Relay way™_: in [Relay](https://facebook.github.io/relay/), data requirements are declared alongside the React components that need the data
* **Execute JavaScript snippets** (`EXEC` command, or `!` for short)
* **Insert the result of JavaScript snippets** in your document (`INS`, or `=` for short)
* **Create images and hyperlinks dynamically** (`IMAGE`, `LINK`) — great for on-the-fly QR codes, downloading photos straight to your reports, charts… even maps!
* Add **loops** with `FOR`/`END-FOR` commands, with support for table rows, nested loops, and JavaScript processing of elements (filter, sort, etc)
* Include contents **conditionally**, `IF` a certain JavaScript expression is truthy
* Define custom **aliases** for some commands (`ALIAS`) — useful for writing table templates!
* Run all JavaScript in a **separate Node VM (using the vm2 library) for security**
* Include **literal XML**
* Plenty of **examples** in this repo (with Node, Webpack and Browserify)

Contributions are welcome!

## Installation

```
$ npm install docx-templates
```

...or using yarn:

```
$ yarn add docx-templates
```

## Node usage

Here is a (contrived) example, with report data injected directly as an object:

```js
import createReport from 'docx-templates';

createReport({
  template: 'templates/myTemplate.docx',
  output: 'reports/myReport.docx',
  data: {
    name: 'John',
    surname: 'Appleseed',
  },
});
```

This will create a report based on the input data at the specified path. Some notes:

* All paths are relative to `process.cwd()`
* If the output location is omitted, a report will be generated in the same folder as the template

You can also **provide a sync or Promise-returning callback function (query resolver)** instead of an object `data`:

```js
createReport({
  template: 'templates/myTemplate.docx',
  output: 'reports/myReport.docx',
  data: query => graphqlServer.execute(query),
});
```

Your resolver callback will receive the query embedded in the template (in a `QUERY` command) as an argument.

Other options (with defaults):

```js
createReport({
  // ...
  additionalJsContext: {
    // all of these will be available to JS snippets in your template commands (see below)
    foo: 'bar',
    qrCode: async url => {
      /* build QR and return image data */
    },
  },
  cmdDelimiter: '+++',
  literalXmlDelimiter: '||',
  processLineBreaks: true,
  noSandbox: false,
  vm2Sandbox: false, // note that vm2 sandbox is safer than Node's
});
```

You can specify how template can be read in to buffer, how report can be saved and how images in template processing can be read. Follow the example below:

```js
const fse = require('fs-extra')
const path = require('path')

const getImage = async (imagePar) => {
  const { path: imgPath } = imagePars;
  if (!imgPath) throw new Error('Specify image `path`');
  const extension = path.extname(imgPath).toLowerCase()
  const data = await fse.readFile(imgPath);
  return { extension, data };
}

const readTemplate = async name => {
  const buffer = await fse.readFile(name)
  return buffer
}

const writeReport = async (name, report) => {
  await fse.writeFile(name, report);
}

const makeReport = async (template, output, data, delimeter = '#') => {
  await createReport({ template, output, data, cmdDelimiter: delimeter, additionalJsContext }, getImage, readTemplate, writeReport)
}

makeReport('template.docx', 'result.docx', { name: 'John Dow', image: { width: 10, height: 15, path: 'image.png' }, splitText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'})

```

These are internally default implementations. It is up to you to handle name of template or imagePair object. The name can be an id or whatever else and can be read from network or db. Anyway you have to return buffer to proceed.

Check out the [Node examples folder](https://github.com/guigrpa/docx-templates/tree/master/packages/example-node).

## Browser usage

When using docx-templates in the browser, you cannot provide the template as a path: you have to provide the template contents as a buffer. For example, get a File object with:

```html
<input type="file">
```

Then read this file in an ArrayBuffer, feed it to docx-templates, and download the result:

```js
import createReport from 'docx-templates';

const onTemplateChosen = async () => {
  const template = await readFileIntoArrayBuffer(myFile);
  const report = await createReport({
    template,
    data: { name: 'John', surname: 'Appleseed' },
  });
  saveDataToFile(
    report,
    'report.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
};

// Load the user-provided file into an ArrayBuffer
const readFileIntoArrayBuffer = fd =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(fd);
  });
```

You can find an example implementation of `saveDataToFile()` [in the Webpack example](https://github.com/guigrpa/docx-templates/blob/master/packages/example-webpack/client/index.js).

With the default configuration, browser usage can become slow with complex templates due to the usage of JS sandboxes for security reasons. _If the templates you'll be using with docx-templates can be trusted 100%, you can disable the security sandboxes by configuring `noSandbox: true`_. **Beware of arbitrary code injection risks**:

```js
createReport({
  // ...
  // USE ONLY IN THE BROWSER, AND WITH TRUSTED TEMPLATES
  noSandbox: true, // WARNING: INSECURE
});
```

If, on the other side, you prefer higher security:

```js
createReport({
  vm2Sandbox: true, // or even an options object to pass through to vm2
});
```

Check out the examples [using Webpack](https://github.com/guigrpa/docx-templates/tree/master/packages/example-webpack) and [using Browserify](https://github.com/guigrpa/docx-templates/tree/master/packages/example-browserify).

## Writing templates

You can find several template examples in this repo:

* [SWAPI](https://github.com/guigrpa/docx-templates/tree/master/packages/example-node), a good example of what you can achieve embedding a template (GraphQL in this case) in your report, including a simple script for report generation. Uses the freak-ish online [Star Wars GraphQL API](https://github.com/graphql/swapi-graphql).
* [Dynamic images](https://github.com/guigrpa/docx-templates/tree/master/packages/example-node): with examples of images that are dynamically downloaded or created. Check out the _images-many-tiles_ example for a taste of this powerful feature.
* Browser-based examples [using Webpack](https://github.com/guigrpa/docx-templates/tree/master/packages/example-webpack) and [using Browserify](https://github.com/guigrpa/docx-templates/tree/master/packages/example-browserify).

Currently supported commands are defined below.

### `QUERY`

You can use GraphQL, SQL, whatever you want: the query will be passed unchanged to your `data` query resolver.

```
+++QUERY
query getData($projectId: Int!) {
  project(id: $projectId) {
    name
    details { year }
    people(sortedBy: "name") { name }
  }
}
+++
```

For the following sections (except where noted), we assume the following dataset:

```js
const data = {
  project: {
    name: 'docx-templates',
    details: { year: '2016' },
    people: [{ name: 'John', since: 2015 }, { name: 'Robert', since: 2010 }],
  },
};
```

### `INS` (`=`)

Inserts the result of a given JavaScript snippet:

```
+++INS project.name+++ (+++INS project.details.year+++)
or...
+++INS `${project.name} (${$details.year})`+++
```

Note that the last evaluated expression is inserted into the document, so you can include more complex code if you wish:

```
+++INS
const a = Math.random();
const b = Math.round((a - 0.5) * 20);
`A number between -10 and 10: ${b}.`
+++
```

You can also use this shorthand notation:

```
+++= project.name+++ (+++= project.details.year+++)
+++= `${project.name} (${$details.year})`+++
```

You can also access functions in the `additionalJsContext` parameter to `createReport()`, which may even return a Promise. The resolved value of the Promise will be inserted in the document.

Use JavaScript's ternary operator to implement an _if-else_ structure:

```
+++= $details.year != null ? `(${$details.year})` : ''+++
```

### `EXEC` (`!`)

Executes a given JavaScript snippet, just like `INS` or `=`, but doesn't insert anything in the document. You can use `EXEC`, for example, to define functions or constants before using them elsewhere in your template.

```
+++EXEC
const myFun = () => Math.random();
const MY_CONSTANT = 3;
+++

+++! const ANOTHER_CONSTANT = 5; +++
```

### `IMAGE`

Includes an image with the data resulting from evaluating a JavaScript snippet:

```
+++IMAGE qrCode(project.url)+++
```

In this case, we use a function from `additionalJsContext` object passed to `createReport()` that looks like this:

```js
  additionalJsContext: {
    qrCode: url => {
      const dataUrl = createQrImage(url, { size: 500 });
      const data = dataUrl.slice('data:image/gif;base64,'.length);
      return { width: 6, height: 6, data, extension: '.gif' };
    },
  }
```

The JS snippet must return an _image object_ or a Promise of an _image object_, containing:

* `width` in cm
* `height` in cm
* `path` _[optional]_ (in Node only): path to the image to be embedded (absolute or relative to the current working directory)
* `data` _[optional]_: either an ArrayBuffer or a base64 string with the image data
* `extension` _[optional]_: e.g. `.png`

Either specify the `path` or `data` + `extension`.

### `LINK`

Includes a hyperlink with the data resulting from evaluating a JavaScript snippet:

```
+++LINK ({ url: project.url, label: project.name })+++
```

If the `label` is not specified, the URL is used as a label.

### `FOR` and `END-FOR`

Loop over a group of elements (resulting from the evaluation of a JavaScript expression):

```
+++FOR person IN project.people+++
+++INS $person.name+++ (since +++INS $person.since+++)
+++END-FOR person+++
```

Since JavaScript expressions are supported, you can for example filter the loop domain:

```
+++FOR person IN project.people.filter(person => person.since > 2013)+++
...
```

`FOR` loops also work over table rows:

```
----------------------------------------------------------
| Name                         | Since                   |
----------------------------------------------------------
| +++FOR person IN             |                         |
| project.people+++            |                         |
----------------------------------------------------------
| +++INS $person.name+++       | +++INS $person.since+++ |
----------------------------------------------------------
| +++END-FOR person+++         |                         |
----------------------------------------------------------
```

Finally, you can nest loops (this example assumes a different data set):

```
+++FOR company IN companies+++
+++INS $company.name+++
+++FOR person IN $company.people+++
* +++INS $person.firstName+++
+++FOR project IN $person.projects+++
    - +++INS $project.name+++
+++END-FOR project+++
+++END-FOR person+++

+++END-FOR company+++
```

### `IF` and `END-IF`

Include contents conditionally (depending on the evaluation of a JavaScript expression):

```
+++IF person.name === 'Guillermo'+++
+++= person.fullName +++
+++END-IF+++
```

Similarly to the `FOR` command, it also works over table rows. You can also nest `IF` commands
and mix & match `IF` and `FOR` commands. In fact, for the technically inclined: the `IF` command
is implemented as a `FOR` command with 1 or 0 iterations, depending on the expression value.

### `ALIAS` (and alias resolution with `*`)

Define a name for a complete command (especially useful for formatting tables):

```
+++ALIAS name INS $person.name+++
+++ALIAS since INS $person.since+++

----------------------------------------------------------
| Name                         | Since                   |
----------------------------------------------------------
| +++FOR person IN             |                         |
| project.people+++            |                         |
----------------------------------------------------------
| +++*name+++                  | +++*since+++            |
----------------------------------------------------------
| +++END-FOR person+++         |                         |
----------------------------------------------------------
```

### `SPLIT`

Split string in to charaters in table cells - one character in one cell

```
+++SPLIT ({string:name, max:30})+++
```

This splits string into table of 30 cells. It adds new rows if string is more when 30 symbols
Define max length on your own needs (may be with try and error approach :) )


```
+++SPLIT name+++
```

This splits string in one table row only


## Replacing template images

**Note**: this feature is **deprecated** as of v2.4.0 and may be removed in future releases. Please use the `IMAGE` command instead.

You can replace images in your template by specifying the `replaceImages` option when you create your report:

```js
createReport({
  // ...
  replaceImages: {
    'image1.png': '/absolute/path/to/newImage1.png',
    'image3.png': '/absolute/path/to/newImage3.png',
  },
});
```

If you prefer, you can pass in a base64 string with the contents (if you're using docx-templates in the browser, this is the only supported way):

```js
createReport({
  // ...
  replaceImagesBase64: true,
  replaceImages: {
    'image1.png': '<base64 data>',
    'image3.png': '<base64 data>',
  },
});
```

You can determine the original image file names by inspecting your template: unzip your .docx file (you may need to duplicate it and change its extension to .zip before), navigate to the `word/media` folder inside and find the image you want to replace:

```
├─word
| ├─media
| | ├─image1.png
| | ├─image2.png
| | ├─image3.png
| | ├─...
```

## [Changelog](https://github.com/guigrpa/docx-templates/blob/master/CHANGELOG.md)

## Similar projects

* [docxtemplater](https://github.com/open-xml-templating/docxtemplater) (believe it or not, I just discovered this very similarly-named project after brushing up my old CS code for `docx-templates` and publishing it for the first time!). It provides lots of goodies, but doesn't allow (AFAIK) embedding queries or JS snippets.

* [docx](https://github.com/dolanmiu/docx) and similar ones - generate docx files from scratch, programmatically. Drawbacks of this approach: they typically do not support all Word features, and producing a complex document can be challenging.

## License (MIT)

Copyright (c) [Guillermo Grau Panea](https://github.com/guigrpa) 2016-now

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
