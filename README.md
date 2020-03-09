# Lady Luck (Matrix Chronicles of Darkness bot)

This bot automatically rolls digital dice for Chronicles of Darkness, rerolls exploding dice, and counts successes. You can invite Lady Luck into any Matrix chat room and she will join without question.

Once she is there you can use the following command:

`!cofd <dice pool> [<options>]`

The following options are available:

`8` -- 8-Again
`9` -- 9-Again
`n` -- No rerolls
`r` -- Rote-Action ability
`b` -- Ones botch

These options can be mixed and matched:

Example outputs:

`!cofd 10` -- roll ten dice with 10-Again

`!cofd 10 8` -- roll ten dice with 8-Again

`!cofd 20 b` -- roll twenty dice where ones botch

`!cofd 15 8r` -- roll fifteen dice with both 8-Again **AND** ones rote actions available

#Cyberpunk 2020 Rolls

A CyberPunk 2020 roller has been added. You can use it this way:

`!cp <modifiers> [<luck>]`

Modifiers can be any integer. Luck can be any non-negative integer. The luck modifier uses noire's house rule on the use of luck, where if the roll on a die + the remaining luck meets or exceeds 10, then it explodes, even if it isn't a natural ten. The luck "used up" to get to ten is deducted from the next roll. For example, if you spend 5 luck and roll 7, you use up 3 of those luck points to get to 10, and it explodes. You add the remaining 2 luck spent to the next roll, and so on.

# Running On Your Server

Move `config.json.example` to `config.json` and fill in the values therein. Install any packages needed. Then run `nohup node ladyluck.js &`.
