var fs = require('fs');
var path = require('path');

module.exports = {
  selector: '.source.c, .source.cpp',
  disableForSelector: '.source.c .comment',
  completions: {},
  inclusionPriority: 0,
  suggestionPriority: 0,

  getSuggestions: function({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    var inFunction = this.isInFunction(scopeDescriptor);
    if (inFunction) {
      var context = this.getFunctionContext(editor, bufferPosition);
      if (context) {
        // DO your evaluations with : context.functionName and context.argument
      }
    }

    var caseSens = false;
    if(atom.config.get('language-amigaos-c.autoCompPrefs.caseSens') == "On") caseSens = true;

    if (this.getPredWord(editor, bufferPosition) == "struct") return(this.suggestStructs(prefix, caseSens));

    if (prefix.length < 3 || atom.config.get('language-amigaos-c.autoCompPrefs.autoComplete') == false) return([]);

    var suggestions = [];
    var suggestion;
    var item;

    //if the cursor is inside function scopes, coder is very probably typing arguments.
    //...so switch to caseSensitive mode not to annoy him/her with suggestions.
    if(atom.config.get('language-amigaos-c.autoCompPrefs.caseSens') == "Smart") {
      if (inFunction) caseSens = true;
      //...yet if the coder typed some specific patterns, switch to inCaseSensitive mode to provide suggestions.
      if (this.checkForPatterns(prefix.toLowerCase())) caseSens = false;
    }

    for (var i = 0, len = this.completions.length; i < len; i++) {
      item = this.completions[i];
      suggestion = {
        "snippet": item.snippet,
        "displayText": item.displayText,
        "replacementPrefix": prefix,
        "type": item.type,
        "leftLabel": item.leftLabel,
        "description": item.description,
        "descriptionMoreURL": item.descriptionMoreURL
      };
      if (item.type != "struct" && this.compareStrings(item.displayText, prefix, caseSens)) suggestions.push(suggestion);
    }
    return(suggestions);
  },

  compareStrings: function(a, b, caseSens) {
    var maxLength = (a.length < b.length) ? a.length : b.length;
    if (!caseSens){
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    return(a.substring(0, maxLength) === b.substring(0, maxLength));
  },

  checkForPatterns: function(prefix) {
    var pattern = "(?:^ahi_)|(?:^mui(?:a|m|l)?)";
    if (prefix.match(pattern)) return(true);
    else return(false);
  },

  getPredWord: function(editor, bufferPosition) {
    if (bufferPosition.column == 0) return null;
    var wordStart = [bufferPosition.row,0];
    var wordEnd   = [bufferPosition.row,0];
    var currentStart;
    //Skip current word:
    for (var i = bufferPosition.column; true ; i--) {
      var ch = editor.getTextInBufferRange([[bufferPosition.row,i-1],[bufferPosition.row,i]]);
      if (i == 0) return null;
      if (ch.match(/\w/)) continue;
      else {
        currentStart = i;
        break;
      }
    }
    //Find predecessor end
    for (var i = currentStart; true; i--) {
      var ch = editor.getTextInBufferRange([[bufferPosition.row,i-1],[bufferPosition.row,i]]);
      if (i == 0) return null;
      if (!ch.match(/\w/)) continue;
      else {
        wordEnd[1] = i;
        break;
      }
    }
    //Find predecessor start
    for (var i = wordEnd[1]; true; i--) {
      var ch = editor.getTextInBufferRange([[bufferPosition.row,i-1],[bufferPosition.row,i]]);
      if (i == 0 || !ch.match(/\w/)) {
        wordStart[1] = i;
        break;
      }
    }

    //return predword
    return(editor.getTextInBufferRange([wordStart, wordEnd]));
  },

  isInFunction: function(scopeDescriptor) {
    var result = false;
    for (var i = 0; i < scopeDescriptor.scopes.length; i++) {
      if (scopeDescriptor.scopes[i] == 'meta.function.c' || scopeDescriptor.scopes[i] == 'meta.function-call.c') result = true;
      if (scopeDescriptor.scopes[i] == 'entity.name.function.c') result = false;
    }
    return result;
  },

  getFunctionContext: function(editor, bufferPosition) {
    //find the name of the enclosing function at cursor position
    //(also detect at which argument of the function the user is typing now)
    var context;
    var funcName;
    var nameStart = [0, 0];
    var nameEnd   = [0, 0];
    var bufPos    = [bufferPosition.row, bufferPosition.column];
    var innerPrns = 0;
    var argCount  = 0;
    //find function name end
    do {
      var ch = editor.getTextInBufferRange([[bufPos[0],bufPos[1]-1], bufPos])
      if (ch == ',' && innerPrns == 0) argCount++;
      if (ch == ')') innerPrns++;
      if (ch == '(') {
        if (innerPrns == 0) {
          // jump any possible whitespaces
          while (bufPos = this.detractBufPos(editor, bufPos)) {
            if (editor.getTextInBufferRange([[bufPos[0],bufPos[1]-1], bufPos]).match(/\w/)) break;
          }
          nameEnd = bufPos;
          break;
        }
        else innerPrns--;
      }
      bufPos = this.detractBufPos(editor, bufPos);
    } while (bufPos);
    if (!bufPos) return null;

    //find function name start
    do {
      var ch = editor.getTextInBufferRange([[bufPos[0],bufPos[1]-1], bufPos])
      if (bufPos[1] == 0 || !ch.match(/\w/)) {
        nameStart = bufPos;
        break;
      }
      bufPos = this.detractBufPos(editor, bufPos);
    } while (bufPos);

    funcName = editor.getTextInBufferRange([nameStart, nameEnd]);
    context = {
      functionName: funcName,
      argument: ++argCount
    };
    return (context);
  },

  detractBufPos: function(editor, bufPos) {
    if (bufPos[1] == 0) {
      if (bufPos[0] == 0) return null;
      else return ([bufPos[0]-1, editor.lineTextForBufferRow(bufPos[0]-1).length]);
    }
    else {
      return([bufPos[0],bufPos[1]-1]);
    }
  },

  suggestStructs: function(prefix, caseSens) {
    var suggestions = [];
    var suggestion;
    var item;
    for (var i = 0, len = this.completions.length; i < len; i++) {
      item = this.completions[i];
      suggestion = {
        "snippet": item.displayText,
        "displayText": item.displayText,
        "replacementPrefix": prefix,
        "type": item.type,
        "leftLabel": item.type,
        "description": item.description,
        "descriptionMoreURL": item.descriptionMoreURL
      };
      if (item.type == "struct" && this.compareStrings(item.displayText, prefix, caseSens)) suggestions.push(suggestion);
    }
    return(suggestions);
  },

  loadCompletions: function() {
    if (fs.existsSync(path.resolve(__dirname, '..', './completions/autoCompletions.JSON'))) {
      fs.readFile(path.resolve(__dirname, '..', './completions/autoCompletions.JSON'), (err, data) => {
        if(err) throw err;
        this.completions = JSON.parse(data);
      });
    }
  }
}
