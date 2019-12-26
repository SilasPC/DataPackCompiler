scoreboard players operation exprtest_x_break globals = 1 constants
scoreboard players operation exprtest_x_tmp globals = exprtest_b globals
scoreboard players operation exprtest_x_tmp globals += 1 constants
scoreboard players operation exprtest_x_tmp1 globals = exprtest_x_y globals
scoreboard players operation exprtest_x_tmp1 globals *= exprtest_x_tmp globals
scoreboard players operation exprtest_a globals += exprtest_x_tmp1 globals
scoreboard players operation exprtest_x_tmp3 globals = exprtest_a globals
scoreboard players operation exprtest_x_tmp3 globals -= 5 constants
scoreboard players operation xprtst_x_rtrn globals = exprtest_x_tmp3 globals
function tmp:exprtest_x_controlflow1