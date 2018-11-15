var fs = require('fs');
var path = require('path');

module.exports = {
  selector: '.source.c, .source.cpp',
//disableForSelector: '.comment .string',  // This value is deprecated! So I wrote my own.
  disabledScopes: ["comment", "string"],
  completions: {},
  fncContext: {},
  inclusionPriority: 0,
  suggestionPriority: 0,

  getSuggestions: function({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    var suggestions = [];
    var suggestion;
    var item;
    var caseSens = false;
    var inFunction = this.isInFunction(scopeDescriptor);
    if (inFunction) {
      var context = this.getFunctionContext(editor, bufferPosition);
      if (this.isScopeValid(scopeDescriptor, context)) {
        if (context && !prefix.match("\\(\\s*")) {
          for (var i = 0, maxi = this.fncContext.length; i < maxi; i++) {
            item = this.fncContext[i];
            if (this.match(context.functionName, item.name)) {
              if (item.arguments) {
                var arg;
                for (var c = 0, maxc = item.arguments.length; c < maxc; c++) {
                  arg = item.arguments[c];
                  if (context.first && arg.first && context.first != arg.first) continue;
                  if ((arg.num && this.match(context.argument, arg.num)) || (arg.type == "tag" && context.argument >= item.tagStrt)) {
                    if (context.previous && arg.type == "tag" && ((context.argument-item.tagStrt)%2)) {
                      if (arg.values) {
                        for (var l = 0; l < arg.values.length; l++) {
                          if (this.match(context.previous, arg.values[l].tag)) {
                            // first push the ones matching with current prefix
                            for (var t = 0, maxt = arg.values[l].suggestions.length; t < maxt; t++) {
                              if (this.compareStrings(arg.values[l].suggestions[t], prefix, false)) {
                                suggestion = {
                                  "snippet": arg.values[l].suggestions[t],
                                  "displayText": arg.values[l].suggestions[t],
                                  "replacementPrefix": prefix,
                                  "type": arg.values[l].type
                                };
                                suggestions.push(suggestion);
                              }
                            }
                            // now push the rest
                            for (var t = 0, maxt = arg.values[l].suggestions.length; t < maxt; t++) {
                              if (!this.strInSuggestions(suggestions, arg.values[l].suggestions[t])) {
                                suggestion = {
                                  "snippet": arg.values[l].suggestions[t],
                                  "displayText": arg.values[l].suggestions[t],
                                  "replacementPrefix": prefix,
                                  "type": arg.values[l].type
                                };
                                suggestions.push(suggestion);
                              }
                            }
                            break;
                          }
                        }
                      }
                    }
                    else {
                      var step = 1;
                      var leftLab;
                      if (arg.type == "tag") step = 2;
                      // first push the ones matching with current prefix
                      for (var l = 0, maxl = arg.suggestions.length; l < maxl; l+=step) {
                        if (this.compareStrings(arg.suggestions[l], prefix, false)) {
                          if (step == 2 && arg.suggestions[l] != "TAG_END") leftLab = arg.suggestions[l+1];
                          else leftLab = null;
                          suggestion = {
                            "snippet": arg.type == "string" ? this.makeSnippet(scopeDescriptor, arg.suggestions[l]): arg.suggestions[l],
                            "displayText": arg.suggestions[l],
                            "replacementPrefix": prefix,
                            "type": arg.type,
                            "leftLabel": leftLab
                          };
                          suggestions.push(suggestion);
                        }
                      }
                      // now push the rest
                      for (var l = 0, maxl = arg.suggestions.length; l < maxl; l+=step) {
                        if (!this.strInSuggestions(suggestions, arg.suggestions[l])) {
                          if (step == 2 && arg.suggestions[l] != "TAG_END") leftLab = arg.suggestions[l+1];
                          else leftLab = null;
                          suggestion = {
                            "snippet": arg.type == "string" ? this.makeSnippet(scopeDescriptor, arg.suggestions[l]): arg.suggestions[l],
                            "displayText": arg.suggestions[l],
                            "replacementPrefix": prefix,
                            "type": arg.type,
                            "leftLabel": leftLab
                          };
                          suggestions.push(suggestion);
                        }
                      }
                    }
                    break;
                  }

                }
              }
              break;
            }
          }
        }
      }
      else return(suggestions);
    }
    else if (!this.isScopeValid(scopeDescriptor, null)) return(suggestions);

    if (atom.config.get('language-amigaos-c.autoCompPrefs.caseSens') == "On") caseSens = true;

    if (this.getPredWord(editor, bufferPosition) == "struct") return(this.suggestStructs(prefix, caseSens));

    if (prefix.length < 3 || atom.config.get('language-amigaos-c.autoCompPrefs.autoComplete') == false) return(suggestions);

    //if the cursor is inside function scopes, coder is very probably typing arguments.
    //...so switch to caseSensitive mode not to annoy him/her with suggestions.
    if (atom.config.get('language-amigaos-c.autoCompPrefs.caseSens') == "Smart") {
      if (inFunction) caseSens = true;
      //...yet if the coder typed some specific patterns, switch to inCaseSensitive mode to provide suggestions.
      if (this.checkForPatterns(prefix.toLowerCase())) caseSens = false;
    }

    for (var i = 0, len = this.completions.length; i < len; i++) {
      item = this.completions[i];
      if (item.type != "struct" && this.compareStrings(item.displayText, prefix, caseSens)) {
        suggestion = {
          "snippet": item.snippet,
          "displayText": item.displayText,
          "replacementPrefix": prefix,
          "type": item.type,
          "leftLabel": item.leftLabel,
          "description": item.description,
          "descriptionMoreURL": item.descriptionMoreURL
        };
        suggestions.push(suggestion);
      }
    }
    return(suggestions);
  },

  match: function(val, array) {
    for (var i = array.length; i--;) {
      if (val == array[i]) return true;
    }
    return false;
  },

  isScopeValid: function(scopeDescriptor, context)
  {
    if (context) {
      if (context.functionName == "OpenLibrary" && context.argument == 1) return true;
    }
    for (var i = 0; i < scopeDescriptor.scopes.length; i++) {
      for (var l = 0; l < this.disabledScopes.length; l++) {
        if (this.compareStrings(this.disabledScopes[l], scopeDescriptor.scopes[i], false)) return false;
      }
    }
    return true;
  },

  makeSnippet: function(scopeDescriptor, sgstStr)
  {
    var inStr = false;
    for (var i = 0; i < scopeDescriptor.scopes.length; i++) {
      if (scopeDescriptor.scopes[i] == 'string.quoted.double.c') {
        inStr = true;
        break;
      }
    }
    if (inStr) {
      return sgstStr;
    }
    else {
      return (("\"".concat(sgstStr)).concat("\""));
    }
  },

  strInSuggestions: function(array, str) {
    for (var i = 0; i < array.length; i++)
    {
      if (array[i].displayText == str) return true;
    }
    return false;
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

  getSuccWord: function(editor, bufferPosition) {
    var wordStart = [0, 0];
    var wrdStrFnd = false;
    var wordEnd   = [0, 0];
    var ch;
    do {
      ch = editor.getTextInBufferRange([[bufferPosition[0],bufferPosition[1]-1], bufferPosition]);
      if (!wrdStrFnd && ch.match(/\w/)) {
        wrdStrFnd = true;
        wordStart = this.detractBufPos(editor, bufferPosition);
      }
      if (wrdStrFnd && !ch.match(/\w/)) {
        wordEnd   = this.detractBufPos(editor, bufferPosition);
        return (editor.getTextInBufferRange([wordStart, wordEnd]));
      }

      bufferPosition = this.advanceBufPos(editor, bufferPosition);
    } while (bufferPosition);

    return null;
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
    //(also return the previous argument string in the function if any)
    //(also return the first argument string in the function if any)
    var context;
    var funcName;
    var prevArg;
    var firstArg  = null;
    var nameStart = [0, 0];
    var nameEnd   = [0, 0];
    var prevStart = [0, 0];
    var prevEnd   = [0, 0];
    var firstStart= [0, 0];
    var firstEnd  = [0, 0];
    var prvEndFnd = false;
    var prvStrFnd = false;
    var bufPos    = [bufferPosition.row, bufferPosition.column];
    var innerPrns = 0;
    var argCount  = 0;
    //find function name end
    do {
      var ch = editor.getTextInBufferRange([[bufPos[0],bufPos[1]-1], bufPos])
      if (argCount == 1) {
        if (!prvEndFnd && ch.match(/\w/)) {
          prevEnd = bufPos;
          prvEndFnd = true;
        }
        if (!prvStrFnd && prvEndFnd && !ch.match(/\w/)) {
          prevStart = bufPos;
          prvStrFnd = true;
        }
      }
      if (ch == ',' && innerPrns == 0) argCount++;
      if (ch == ')') innerPrns++;
      if (ch == '(') {
        if (innerPrns == 0) {
          // get first argument
          if (argCount > 1) firstArg = this.getSuccWord(editor, bufPos);
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
    if (prvEndFnd) {
      prevArg = editor.getTextInBufferRange([prevStart, prevEnd]);
    }
    else prevArg = null;
    context = {
      functionName: funcName,
      argument: ++argCount,
      previous: prevArg,
      first: firstArg
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

  advanceBufPos: function(editor, bufPos) {
    var col = bufPos[1] + 1;
    var row = bufPos[0];
    if (col > editor.lineTextForBufferRow(row).length)
    {
      if (++row > editor.getLastBufferRow())
        return null;
      else if (editor.lineTextForBufferRow(row).length)
        return ([row, 0]);
      else return null;
    }
    else return ([bufPos[0], col]);
  },

  suggestStructs: function(prefix, caseSens) {
    var suggestions = [];
    var suggestion;
    var item;
    for (var i = 0, len = this.completions.length; i < len; i++) {
      item = this.completions[i];
      if (item.type == "struct" && this.compareStrings(item.displayText, prefix, caseSens)) {
        suggestion = {
          "snippet": item.displayText,
          "displayText": item.displayText,
          "replacementPrefix": prefix,
          "type": item.type,
          "leftLabel": item.type,
          "description": item.description,
          "descriptionMoreURL": item.descriptionMoreURL
        };
        suggestions.push(suggestion);
      }
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
    if (fs.existsSync(path.resolve(__dirname, '..', './completions/fncContext.JSON'))) {
      fs.readFile(path.resolve(__dirname, '..', './completions/fncContext.JSON'), (err, data) => {
        if(err) throw err;
        this.fncContext = JSON.parse(data);
      });
    }
  }
};
