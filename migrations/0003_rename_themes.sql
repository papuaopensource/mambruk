-- Nama tema diganti ke set yang lebih rapi. Baris lama tidak otomatis ikut:
-- resolveTheme memang jatuh ke tema bawaan kalau namanya tidak dikenal, tapi
-- nilai di database tetap basi dan pemilih tema di dashboard jadi tidak ada
-- yang tersorot.

UPDATE pages SET theme = 'noir' WHERE theme = 'brutal';
UPDATE pages SET theme = 'lake' WHERE theme = 'malam';
UPDATE pages SET theme = 'sage' WHERE theme = 'papua';
UPDATE pages SET theme = 'rise' WHERE theme = 'senja';
