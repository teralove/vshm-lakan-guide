**June 7, 2017 - Only tested this once so far and it seemed fine... There's probably bugs somewhere.**

**The Normal Mode version can be found here: [https://github.com/teralove/vsnm-lakan-guide](https://github.com/teralove/vsnm-lakan-guide)**

# VSHM Lakan Guide
Calls out mechanics during the fight.

Available messages:

* **Debuff (closest)**  - aka Marks/Curse
* **Spread**  - aka Circles
* **Gather + cleanse**  - aka Bombs
* **Debuff (furthest)**  - aka Marks/Curse
* **Gather**  - aka Circles
* **Gather + no cleanse**  - aka Bombs
* **Get out**  - for Begone! (Purple)
* **Get in**  - for Begone! (Red/Orange)
* **Ring soon**  - a warning for incoming soul mechanic
* **plague/regress**  - for the shield when entering Velik's soul
* **sleep**  - for the shield when exiting Velik's soul


### Chat commands:
* **!VSHM-Lakan** or **!VSHMLakan** - Toggles the module off/on (On by default)
* **!VSHM-Lakan.party** or **!VSHMLakan.party** - Toggles sending messages to party/yourself (Default is yourself only)

Commands are not case-sensitive. [slash](https://github.com/baldera-mods/slash) is supported but not required


### Info:
* You can disable "next" messages by setting the variable 'showNextMechanicMessage' to false
* You can disable shield time warnings by setting the variable 'showShieldWarnings' to false
* You can disable the Begone messages by setting the variable 'showBegoneMessages' to false


### Known Issues:
* Joining an in-progress fight (as in, relogging on from a disconnect) will probably screw something up or throw errors.


## Changelog 
### 1.0.1
* [+] Added followup hint (sleep, plague/regress) to the ring/shield warning messages.