let stack;
let currentToken = null
let currentAttribute = null
let currentTextNode = null


function emit(token) {
    let top = stack[stack.length - 1];

    if (token.type === "startTag") {
        let element = {
            type: "element",
            children: [],
            attributes: []
        };

        element.tagName = token.tagName;

        for (let p in token) {
            if (p !== "type" && p !== "tagName") {
                element.attributes.push({
                    name: p,
                    value: token[p]
                })
            }
        }
        top.children.push(element);
        element.parent = top

        if (!token.isSelfClosing) {
            stack.push(element)
        }
        currentTextNode = null
    } else if (token.type === "endTag") {
        if (top.tagName !== token.tagName) {
            throw new Error("Tag start end dosen't match!")
        } else {
            stack.pop();
        }
        currentTextNode = null
    } else if (token.type === "text") {
        // 如果文本节点为空就创建一个新的文本节点
        if (currentTextNode === null) {
            currentTextNode = {
                type: 'text',
                content: ""
            }
            top.children.push(currentTextNode)
        }
        // 如果文本节点不为空就将传入的token的内容加到文本节点中
        currentTextNode.content += token.content
    }
}

const EOF = Symbol("EDF");

// 解析传入的字符时，如果字符开始为<则进入标签开始状态机，如果状态为EOF则为结束状态，其余字符依然进行该状态机的判断，包括>
function data(c) {
    if (c === '<') {
        return tagOpen;
    } else if (c === EOF) {
        emit({
            type: "EOF"
        })
        return;
    } else {
        // 暂时将字符一个一个的传输出去
        emit({
            type: "text",
            content: c
        })
        return data;
    }
}

function tagOpen(c) {
    if (c === '/') {
        // <之后如果为/就表示此时为结束标签开始
        return endTagOpen
    } else if (c.match(/^[a-zA-Z]$/)) {
        // <之后为字母就表示为标签名，跳转到标签名状态机
        currentToken = {
            type: "startTag",
            tagName: ""
        }
        return tagName(c)
    } else {
        emit({
            type: "text",
            content: c
        })
        return data;
    }
}

function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        // 结束标签开始后紧跟着的是字符就跳转到标签名，其余的都会报错
        currentToken = {
            type: "endTag",
            tagName: ""
        }
        return tagName(c)
    } else if (c === '>') {
        throw new Error("Tag start end dosen't match!")
    } else if (c === EOF) {

    } else {

    }
}

function tagName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        // tagName之后紧跟着的是空白符就进入属性名状态
        return beforAttributeName
    } else if (c === '/') {
        // tagName之后紧跟着/表示自封闭标签（如果是闭合标签中tagName后的/会报错，此处没有判断处理）
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        // 如果是字符串中是字母则表示依然为标签名
        currentToken.tagName += c;
        return tagName;
    } else if (c === '>') {
        // 如果标签名之后为>表示解析完成一个标签,进入下一个标签的判断
        emit(currentToken)
        return data
    } else {
        return tagName
    }
}
// 处理标签属性的状态
function beforAttributeName(c) {
    if (c.match(/^[\t\n\g ]$/)) {
        // 如果遇到的是空格就继续返回到处理标签属性的状态
        return beforAttributeName;
    } else if (c === '>' || c === '/' || c === EOF) {
        // 如果标签属性名之后遇到的是>或者/或者是EOF结束标志就表示属性获取完毕，进而跳转到属性名之后的状态机
        return afterAttributeName(c)
    } else if (c === '=') {
        // 一个标签的属性不会一开始就就是=，这是一种错误，不做处理
    } else {
        // 否则就会遇到一个空的字符
        currentAttribute = {
            name: "",
            value: ""
        }
        // 跳转到属性名的状态
        return attributeName(c)
    }
}

function attributeName(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
        // 属性名状态中遇到空格、/、>、EOF就进入到属性名之后的状态机，表示已经获取到了属性名
        return afterAttributeName(c)
    } else if (c === '=') {
        // 属性名后紧跟的是=就条状到属性值状态处理前
        return beforAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === '\"' || c === "" || c === "<") {

    } else {
        currentAttribute.name += c
        return attributeName;
    }
}

function beforAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
        return beforAttributeValue;
    } else if (c === "\"") {
        // 如果属性名后的=后接的是"开头的就跳转到双引号属性值状态
        return doubleQuotedAttributeValue
    } else if (c === "\'") {
        // 如果属性名后的=后接的是'开头的就跳转到单引号属性值状态
        return singleQuotedAttributeValue
    } else if (c === ">") {
        // 如果属性名后的=后接的是>开头的就报错
    } else {
        // 如果属性名后的=后接的不是空格、/、"、'开头的就跳转到无引号属性值状态
        return UnquotedAttributeValue(c)
    }
}

function doubleQuotedAttributeValue(c) {
    if (c === "\"") {
        // 在双引号属性值状态中如果此时以"结尾，此时需要将获取到的属性值赋值给属性
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {

    } else if (c === EOF) {

    } else {
        // 不然就保存获取到的属性值
        currentAttribute.value += c;
        return doubleQuotedAttributeValue
    }
}

function singleQuotedAttributeValue(c) {
    if (c === "\'") {
        // 在双引号属性值状态中如果此时以'结尾，此时需要将获取到的属性值赋值给属性
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {

    } else if (c === EOF) {

    } else {
        // 不然就保存获取到的属性值
        currentAttribute.value += c;
        return singleQuotedAttributeValue
    }
}

function UnquotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        // 在双引号属性值状态中如果此时以'结尾，此时需要将获取到的属性值赋值给属性
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "/") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken)
        return data;
    } else if (c === "\u0000") {

    } else if (c === "\"" || c === "'" || c === "<" || c === "=" || c === "`") {

    } else if (c === EOF) {

    } else {
        // 不然就保存获取到的属性值
        currentAttribute.value += c;
        return UnquotedAttributeValue
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforAttributeName
    } else if (c === "/") {
        return selfClosingStartTag
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken);
        return data;
    } else if (c === EOF) {

    } else {
        throw new Error("unexpected charater \"" + c + "\"")
    }
}

function afterAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return afterAttributeName;
    } else if (c === "/") {
        return selfClosingStartTag
    } else if (c === "=") {
        return beforAttributeValue
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    } else if (c === EOF) {

    } else {
        currentToken[currentAttribute.name] = currentAttribute.value
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c);
    }
}

function selfClosingStartTag(c) {
    if (c === '>') {
        // 自闭合标签后面只有接>才是有效的,其余的都是会报错
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c === 'EOF') {

    } else {

    }
}

module.exports.parserHTML = function parserHTML(html) {
    stack = [{ type: "document", children: [] }];
    currentToken = null
    currentAttribute = null
    currentTextNode = null
    state = data; // 初始状态为data
    for (const c of html) {
        // 对每一个HTML中的字符进行循环，使用状态机进行处理
        state = state(c);
    }
    state = state(EOF); // 使用symbol的唯一性作为状态机的结束状态
    return stack[0]
}