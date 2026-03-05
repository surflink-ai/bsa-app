-- Fix score precision: numeric(3,1) only stores 1 decimal place
-- ISA needs 2 decimal places for averaged scores (e.g., 7.75)
-- Also fix comp_judge_scores to allow 0.1 precision

ALTER TABLE comp_wave_scores ALTER COLUMN score TYPE numeric(5,2);
ALTER TABLE comp_judge_scores ALTER COLUMN score TYPE numeric(4,1);
