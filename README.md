# Syntax highlighting and autocomplete support for AmigaOS API (C/C++)
Adds syntax highlighting and autocomplete snippets for **AmigaOS API** to **C/C++** files in **Atom**.



### Advanced symbol highlighting features
Knows all reserved symbols in the API<sup>1</sup> and highlights them respectively<sup>2</sup>:
![highlighting](https://i.imgsafe.org/ec/ecb79c6b13.gif)
<br>(1): *OS symbols are from* **OS3.9** *&* **OS4.1**, *MUI symbols are from* **mui3.8**.</br>
(2): *Most suitable for* **One Dark Syntax theme** *(default Atom theme)*.

### AutoComplete suggestions and snippets for support functions
Provides instant function suggestions with complete synopsis and powerful snippets for API functions<sup>3</sup>.
![snippets](https://i.imgsafe.org/ec/ecb79cb472.gif)
<br>AutoComplete now also suggests the values and identifiers required in specific arguments of API functions.</br>
![context](https://i.imgsafe.org/62/627f00fdd3.gif)
<br>(3): *Only* **OS3.9**, **OS4.1**, **MUI** *and* **AHI** *symbols (yet)*.</br>

### Detailed preferences page
You can choose which symbols to be highlighted and suggested.<sup>4</sup>
![settings](https://i.imgsafe.org/ec/ecb78ea9c2.gif)
<br>(4): *A restart is required after changes in highlight preferences to apply.*</br>

### Create new Amiga projects on the fly
Requesters to automatically create new Amiga projects (ready to be compiled with working helloworld code and a makefile<sup>5</sup>).
A dialog to create subclass code is also available.
![newproject](https://i.imgsafe.org/62/627f0322c9.gif)
<div>(5): To be able to cross compile with these makefiles it is recommended to install either or all of these toolchains below:</div>
<div>for OS3/OS4: https://github.com/jens-maus/amigaos-cross-toolchain</div>
<div>for MorphOS: https://github.com/AmigaPorts/morphos-cross-toolchain</div>

<br>**Dependencies** : https://github.com/atom/language-c/ *(0.57.0 and higher)*</br>

**IMPORTANT** : On Atom v.1.32 and above you should deactivate Tree Sitter Parsers for highlighting to work properly *(Settings -> Core -> Use Tree Sitter Parsers)*

Contributions are greatly appreciated. Please fork this repository and open a pull request to add snippets, make grammar tweaks, etc.
