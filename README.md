# Syntax highlighting and autocomplete support for AmigaOS API (C/C++)
Adds syntax highlighting and autocomplete snippets for **AmigaOS API** to **C/C++** files in **Atom**.



### Advanced symbol highlighting features
Knows all reserved symbols in the API\* and highlights them respectively\*\*:
![highlighting](https://i.imgsafe.org/ec/ecb79c6b13.gif)
<div>(\*): *OS symbols are from* **OS3.9** *&* **OS4.1**, *MUI symbols are from* **mui3.8**.</div>
<div>(\*\*): *Most suitable for* **One Dark Syntax theme** *(default Atom theme)*.</div>

### AutoComplete suggestions and snippets for support functions
Provides instant function suggestions with complete synopsis and powerful snippets for API functions\*\*\*.
![snippets](https://i.imgsafe.org/ec/ecb79cb472.gif)
AutoComplete now also suggests the values and identifiers required in specific arguments of API functions.
![context](https://i.imgsafe.org/62/627f00fdd3.gif)
<div>(\*\*\*): *Only* **OS3.9**, **OS4.1**, **MUI** *and* **AHI** *symbols (yet)*.</div>

### Detailed preferences page
You can choose which symbols to be highlighted and suggested.\*\*\*\*
![settings](https://i.imgsafe.org/ec/ecb78ea9c2.gif)
<div>(\*\*\*\*): *A restart is required after changes in highlight preferences to apply.*</div>

### Create new Amiga projects on the fly
Requesters to automatically create new Amiga projects (ready to be compiled with working helloworld code and a makefile\*\*\*\*\*).
A dialog to create subclass code is also available.
![newproject](https://i.imgsafe.org/62/627f0322c9.gif)
<div>(\*\*\*\*\*): To be able to cross compile with these makefiles it is recommended to install either or all of these toolchains below:</div>
<div>for OS3/OS4: https://github.com/jens-maus/amigaos-cross-toolchain</div>
<div>for MorphOS: https://github.com/AmigaPorts/morphos-cross-toolchain</div>

<br>**Dependencies** : https://github.com/atom/language-c/ *(0.57.0 and higher)*</br>

**IMPORTANT** : On Atom v.1.32 and above you should deactivate Tree Sitter Parsers for highlighting to work properly *(Settings -> Core -> Use Tree Sitter Parsers)*

Contributions are greatly appreciated. Please fork this repository and open a pull request to add snippets, make grammar tweaks, etc.
