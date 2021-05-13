addiu $sp, $zero, 0x10010000
or $fp, $sp, $zero
jal   main
dead_loop:
j dead_loop
nop
program:
lw $7,0($fp)
lw $8,4($fp)
lw $9,8($fp)
sub $fp,$fp,12
add $10,$zero,0
add $11,$8,$9
bgt $7,$11,l1
j   l2
l1:
mul $12,$8,$9
add $a2,$zero,1
add $13,$12,$a2
add $14,$7,$13
add $15,$zero,$14
l2:
add $15,$zero,$7
l3:
l4:
add $a2,$zero,100
ble $10,$a2,l5
j   l6
l5:
add $a2,$zero,2
mul $16,$15,$a2
add $10,$zero,$16
j   l4
l6:
add $v0,$zero,$10
jr   $ra
demo:
lw $17,0($fp)
sub $fp,$fp,4
add $a2,$zero,2
add $18,$17,$a2
add $17,$zero,$18
add $a2,$zero,2
mul $19,$17,$a2
add $v0,$zero,$19
jr   $ra
main:
add $20,$zero,3
add $21,$zero,4
add $22,$zero,2
sub $sp,$sp,4
sw $ra,0($sp)
add $fp,$fp,4
sw $22,0($fp)
jal  demo
lw $ra,0($sp)
add $sp,$sp,4
add $23,$zero,$v0
sub $sp,$sp,4
sw $ra,0($sp)
add $fp,$fp,12
sw $20,0($fp)
sw $21,4($fp)
sw $23,8($fp)
jal  program
lw $ra,0($sp)
add $sp,$sp,4
add $24,$zero,$v0
add $20,$zero,$24
jr   $ra