<?php
//  WSZYSTKO MALY LITERKAMI

// table - musi byc okreslone - gdy TABLE TAK jest a ACTION - NIE - wtedy - SELECT * FROM dbo.tbltable

// 	ACTION=SELECT -> jezeli DATA=0 to SELECT * FROM dbo.tbltable WHERE CONDITION
//	 			 -> w przeciwnym wypadku sql=encodeURIComponent(JSON.stringify(data));
//	
//	ACTION=INSERT
//
header("Content-type: text/json; charset=UTF-8");
header("Cache-Control: no-transform,public,max-age=3000,s-maxage=9000"); 
//header("Cache-Control: no-cache, must-revalidate"); 
//header('Access-Control-Allow-Origin: http://ummo.pl');
header('Access-Control-Allow-Origin: *');
$opis="\;)";
if (!isset($_REQUEST['table']))  dbError('Nie podano parametru table - nazwy tabeli.\nJeżeli table jest okreslone a parametr select nie - wtedy wypisuje wszystkie rekordy\nJezeli data=0 a action=select wtedy condition okresla warunki\n -> w przeciwnym wypadku sql=encodeURIComponent(JSON.stringify(data))');
if  (!isset($_REQUEST['action'])){
$_REQUEST['action']='select';
	$_REQUEST['condition']='id=id';
	$_REQUEST['data']=0;
		;}
	/* Connect using SQL Server Authentication. */
	$conn = mysqli_connect("impet2.home.pl","impet2","herman123","impet2");
	if (mysqli_connect_errno()) {
		dbError('Blad polaczenia z baza danych');
	}

	//$tab = 'dbo.tbl' . $_REQUEST['table'];
	$tab = $_REQUEST['table'];
	$act = $_REQUEST['action'];
	$con =$_REQUEST['condition'];
	$dat = json_decode($_REQUEST['data']);

	$params = array();

	if ($act == 'select') 
	{//SELECT
		if ($dat !== 0) {
			$tsql = $dat;
		} else {
			$tsql = "SELECT *  FROM $tab WHERE $con";
		}	
		$stmt = mysqli_query($conn, $tsql) or dbError('Blad po zapytaniu');
		$rekordy = array();
		while ($mRow = mysqli_fetch_array($stmt, MYSQLI_ASSOC)) {
			$rekordy[] = $mRow;
		}
		echo json_encode($rekordy);
		mysqli_free_result($stmt);

	} elseif ($act == 'insert') 
	{// INSERT
		if  (!isset($con)){
			$con="id";
		}
		foreach ($dat as $key => $val) {$co[] = $key;
			$va[] = "'$val'";
		};
		$col = implode(', ', $co);
		$values = implode(', ', $va);
		$tsql = "INSERT INTO $tab ($col) VALUES ($values);";
		$stmt = mysqli_query($conn, $tsql) or dbError('Blad po INSERTcie');
		$id = mysqli_insert_id($conn);
		$dat -> $con =intval($id);
		echo json_encode($dat);
	} elseif ($act == 'update') 
	{// UPDATE
		foreach ($dat as $key => $val) {
			$setAr[] = "$key = '$val'";
		}
		$set = implode(', ', $setAr);
		$tsql = "UPDATE $tab SET $set WHERE $con;";
		$stmt = mysqli_query($conn, $tsql);
		$rows_affected = mysqli_affected_rows($conn) or dbError('Blad po update');
		if ($rows_affected == -1) {
			echo "{\"update\":\"No information available.\"}";
		} else {
			echo "{\"update\": $rows_affected}";
		}

	} elseif ($act == 'delete') {
		$tsql = "DELETE FROM $tab WHERE $con;";
		$stmt = mysqli_query($conn, $tsql) or dbError('Blad przy DELETE');
		echo "{}";
	}

	mysqli_close($conn);


function pS($myString){
	$trans=array("<div>"=>"\\n","</div>"=>"","&nbsp;"=>" ","\'"=>"\\'",'\"'=>'\\"',"\\r"=>"","\\n"=>"");
	return strtr($myString,$trans);
	}

function dbError($opis) {
	$error = array();
	$error['opis'] = $opis;
	$error['error'] = mysqli_connect_error();
	die(json_encode($error, JSON_HEX_TAG));

}
?>