var assert = require('assert');
var parserHTML = require('../src/parser.js').parserHTML;
// import { parserHTML } from '../src/parser.js';

describe('parse html:', function () {

    it('<a></a>', function () {
        let tree = parserHTML('<a></a>');
        assert.equal(tree.children[0].tagName, 'a');
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a herf="//time.geekbang.org"></a>', function () {
        let tree = parserHTML('<a herf="//time.geekbang.org"></a>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a herf></a>', function () {
        let tree = parserHTML('<a herf></a>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a herf id></a>', function () {
        let tree = parserHTML('<a herf id></a>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a herf="abc" id></a>', function () {
        let tree = parserHTML('<a herf="abc" id></a>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a id=abc></a>', function () {
        let tree = parserHTML('<a id=abc></a>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a id=abc />', function () {
        let tree = parserHTML('<a id=abc />');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a id=\'abc\' />', function () {
        let tree = parserHTML('<a id=\'abc\' />');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a/>', function () {
        let tree = parserHTML('<a/>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<A /> upper case', function () {
        let tree = parserHTML('<A />');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });

    it('<a>/a>', function () {
        let tree = parserHTML('<a>/a>');
        console.log(tree);
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].type, 'element');
    });

    it('<>', function () {
        let tree = parserHTML('<>');
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].type, 'text');
    });

});
