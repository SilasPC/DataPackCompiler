scoreboard players operation exprtest_x_local globals = exprtest_a globals
scoreboard players operation exprtest_x_y globals = exprtest_x_y globals
function tmp:exprtest_x
scoreboard players operation exprtest_x_y globals = exprtest_x_y globals
scoreboard players operation exprtest_x_tmp1 globals = exprtest_b globals
scoreboard players operation exprtest_x_tmp1 globals += 1 constants
scoreboard players operation exprtest_x_tmp2 globals = exprtest_x_y globals
scoreboard players operation exprtest_x_tmp2 globals *= exprtest_x_tmp1 globals
scoreboard players operation exprtest_a globals += exprtest_x_tmp2 globals
scoreboard players operation exprtest_x_tmp4 globals -= 5 constants
scoreboard players operation xprtst_x_rtrn globals = exprtest_x_tmp4 globals
scoreboard players operation exprtest_x_break globals = 1 constants