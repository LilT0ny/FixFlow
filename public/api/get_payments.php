<?php
require_once 'Database.php';

$payments = Database::getAllPayments();
echo json_encode($payments);
?>
