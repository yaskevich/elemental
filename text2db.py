# -*- coding: utf-8 -*-
import sys;
sys.stdout = open(1, 'w', encoding='utf-8', closefd=False);
import json
import datetime
import csv
import time
import re
import regex
import string
from collections import Counter
import pandas
import unicodedata
import sqlite3

s = "Нeвялічкі вуціны статак рыхтаваўся ў вырай. На азёрах ужо ўсталявалася восень, стала сьцюдзёным паветра, дзьмулі напорыстыя паўночныя вятры. Колькі дзён запар зь няласкавага хмарнага неба чуліся разьвітальныя крыкі журавоў — тыя ўжо ляцелі туды, дзе грэла сонца, была цеплыня і шмат корму. Вуціны статак яшчэ там ня быў; вутачкі вывеліся апошняй вясной у тутэйшым возеры, за лета падрасьлі сярод трысьнягу ды асакі і дбалі толькі пра адно — як наесьціся. Сёлета з кормам стала кепска, ад няспынных дажджоў вада ў азёрах стаяла высокая, падтапіла берагі сенажацяў; буза, якую заўжды падабалі вуткі, апынулася глыбока пад вадой, даставаць зь яе корм было нязручна і цяжка. Ды й корму там чамусь усё менела, бо здатныя мясьціны пазамывала пяском з раскапаных экскаватарамі берагоў. Вуткі да восені пачуваліся слабымі, кепска расьлі і заўсёды былі галодныя."

def unicode_decode(text):
    try:
        return text.encode('utf-8').decode()
    except UnicodeDecodeError:
        return text.encode('utf-8')


def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by db_file
    :param db_file: database file
    :return: Connection object or None
    """
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)

    return None

def remove_punctuation(text):
    # https://stackoverflow.com/questions/11066400/remove-punctuation-from-unicode-formatted-strings/21635971#21635971
    tbl = dict.fromkeys((i for i in range(sys.maxunicode) if unicodedata.category(chr(i)).startswith('P')), ' ')
    tbl[39] = '’'
    tbl[45] = "¦"
    # print (tbl)
    return text.translate(tbl)

def rulesReplace(text):
    text = re.sub('(?<=[знлцс])ь(?=[яюёе])', '’', text)  # чамусьці! зь мяне
    text = re.sub('(?<=[знс])ь(?=[пвнцл])', '', text)  # чамусьці! зь мяне
    # "(.)\1"
    # text = re.sub('(.)ь\1', '\1', text) # чамусьці! зь мяне
    text = re.sub('(?<=(.))ь(?=\\1)', '', text)  # турбуесься
    text = re.sub('^зь$', 'з', text)
    text = re.sub('^бязь?$', 'без', text)
    text = re.sub('^ў', 'у', text)
    text = re.sub('^\\d+$', '', text)
    return text

with open('kolas1.txt', 'r', encoding='utf-8') as myfile:
    big = myfile.read()

abs = open('abbrs.txt', 'w', encoding='utf-8')


hyphenwords = ["больш-менш", "вось-вось", "дзе-нідзе", "з-за", "з-пад", "па-над", "з-над", "чуць-чуць", "ледзь-ледзь", "перш-наперш", "раз-пораз", "яй-права"]
# hyphenwords = ["з-за", "з-пад", "па-над", "з-над", "яй-права"]

mapping = {
"алілу-у-у-я": "алілуя",
"г-э-э-э": "гэ",
"а-а": "а",
"га-а": "га",
"крэсці-ісь-це-сяяя": "крэсцісцеся",
"н-не": "не",
"ніко-о-олі": "ніколі",
"о-о-о": "о",
"тра-ля-ля-ля": "тра-ля-ля",
"ха-ха": "ха",
"ха-ха-ха":"ха",
"ха-ха-ха-ха": "ха"
}

f = open('sents.txt', 'w', encoding='utf-8')
 
pattern = re.compile("[—–…\s\n\r.,:;\"\(\)\+«»!?-]+$")
pattern_adv = re.compile("^па.*?(ску|му)$")
tokens2json  = []

import collections
lasts = []
iterSent = 0
for i, p in enumerate(big.split("\n\n")):
    paragraph = []
    tt = p.strip()
    tt = re.sub("\-(?=\s)", "–", tt)
    tt = re.sub("\.\.\.", "…", tt)
    tt = re.sub("(?<= а)\.(?=\s)", "・", tt)
    if tt:
        # 
        sents = re.split('(?<=[.…!?»])\s+(?=[–А-ЯЎІЁ])', tt)
        for s_num, s_text in enumerate(sents):
            if s_text:
                sent = s_text.strip()
                result = re.search(r'\b(\S*?)$', sent)
                if result:
                    lasts.append(result.group(0))
                # exit()
                
                
                # f.write("["+str(s_num) +"|"+sent + ']\n')
                f.write("["+str(iterSent) +"|"+sent + ']\n')
                
                # tkgroup = []
                for pseudotkn in sent.split():
                    tkns = re.split('([—–\s\n\r.,;:\(\)\"\+«»!?…–])', pseudotkn)
                    # grp = []
                    
                    # print (tkns)
                    
                    # tok = list(filter(None, tkns))
                    for tok in tkns:
                        if tok:
                            # tok = tok.rstrip("\n\r")
                            # print(tok)
                            if pattern.match(tok):
                                # if len(tok) > 1:
                                # print(tok)
                                tokens2json.append({"t":tok, "cl": "ip", "p": i, "s": iterSent})
                            else:
                                lc = tok.lower()
                                if False:
                                # if "-" in lc and lc != "-" and not pattern_adv.match(lc) and "небудзь" not in lc and lc not in hyphenwords:
                                    abs.write(lc+"\n")
                                    if lc in mapping:
                                        tokens2json.append({"t": mapping[lc], "v": pseudotkn, "p": i, "repr": tok, "s": iterSent})
                                    else:
                                        spl_lc = lc.split("-")
                                        spl_ps = pseudotkn.split("-")
                                        if len(spl_lc) == 2:
                                            tokens2json.append({"t": spl_lc[0], "v": spl_lc[0], "p": i, "repr": tok, "s": iterSent})
                                            tokens2json.append({"t":'-', "cl": "ip", "p": i, "s": iterSent})
                                            tokens2json.append({"t": spl_lc[1], "v": spl_lc[1], "p": i, "repr": tok, "s": iterSent})
                                        else:
                                            abs.write("Error with hyphen!"+"\n")
                                else:
                                    # set tag for abbreviations! on japanese dot
                                    tokens2json.append({"t": lc.replace("・", "."), "v": pseudotkn.replace("・", "."), "p": i, "repr": tok.replace("・", "."), "s": iterSent})
                                # print(pseudotkn)
                                # if "-" in tok and "-небудзь" not in tok and tok not in ["з-за", "з-пад", "па-над"]:
                                #     print(lc)
                                    # print("\n")
                                    # print(tt)
                            # if grp: tokens2json.extend(grp)                
                iterSent += 1
                # if iterSent > 3:
                    # print(tokens2json)
                    # exit()
                
        # if tkgroup: paragraph.extend(tkgroup)
    # if paragraph: tokens2json.extend(paragraph)

c = collections.Counter(lasts)
# print(c.most_common(10))

# 63130 {'t': 'двума', 'v': 'двума', 'p': 1999}
# 63131 {'t': 'чамаданчыкамі', 'v': 'чамаданчыкамі,', 'p': 1999}
# 63132 {'t': ',', 'cl': 'ip', 'p': 1999}

conn = create_connection('m.db')


with open('tokenz.json', 'w',  encoding='utf-8') as tokfile:
    json.dump(tokens2json, tokfile, ensure_ascii=False)
    
# exit()
dbcache = {}
with conn:
    sql = ''' INSERT INTO strings(text_id, p, s, form, repr, token_id, unit_id) VALUES(?,?,?,?,?,?,?) '''
    cur = conn.cursor()
    cur.execute("DELETE FROM strings")
    for i, entry in enumerate(tokens2json):
        form_key =  'v' if 'v' in entry else 't'
        repr_key =  'repr' if 'repr' in entry else 't'
        wClass = entry['cl'] if 'cl' in entry else ''
        t = re.sub('^ў', 'у', entry['t'])
        tid  = 0        
        uid = None

            
        if t in dbcache:
            tid  = dbcache[t]
        else:
            cur.execute("SELECT id FROM tokens WHERE token =?", (t,))
            id_exists = cur.fetchone()
            if id_exists:
                tid = id_exists[0]
                dbcache[t] = tid
        if not tid:
            cur.execute('INSERT INTO tokens (token, meta, lemmas, qty) VALUES (?,?, ?, ?)', (t, wClass, 1, 0))
            tid = cur.lastrowid
            dbcache[t] = tid
        else:
            cur.execute("SELECT id FROM units WHERE token_id =?", (tid,))
            uid_exists = cur.fetchone()
            if uid_exists:
                uid = uid_exists[0]
            # exit()
        cur.execute(sql, (1, entry['p'], entry['s'], entry[form_key], entry[repr_key], tid, uid))

exit()


with open('web/tokens.json', 'w') as tokfile:
    json.dump(tokens2json, tokfile)

exit()

s = big.replace('\n', ' ')
listed = remove_punctuation(s.lower()).split()
fixed = [rulesReplace(i) for i in listed]
# tokens = sorted(set(fixed))
# tokens = dict(Counter(fixed))
tokens = Counter(fixed)
# print (tokens.most_common(10))
print(tokens)
# result  = [{'token':key, 'qty':value} for key,value in tokens.items()]
# print(result)
# jsed  = json.dumps(result)
# print(jsed)
with open('data.txt', 'w') as outfile:
    json.dump(tokens, outfile)

# select from tokens
# if not push in tokens, get id
# push into strings
#

# dfr = pandas.DataFrame.from_dict(tokens, orient='index')
# print (dfr)

# CREATE TABLE [tokens] (
#   [id] integer NOT NULL PRIMARY KEY UNIQUE,
#   [token] TEXT,
#   [meta] TEXT,
#   [qty] integer,
#   [lemmas] INT);

# CREATE TABLE [texts] (
#   [id] integer NOT NULL PRIMARY KEY UNIQUE,
#   [author] TEXT,
#   [title] TEXT,
#   [meta] TEXT);
#
# CREATE TABLE [strings] (
#   [id] integer NOT NULL PRIMARY KEY UNIQUE,
#   [text_id] integer,
#   [p] integer,
#   [form] TEXT,
#   [token_id] integer,
#   [structural] CHAR,
#   [seq] INT);

