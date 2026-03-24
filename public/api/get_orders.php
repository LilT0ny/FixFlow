<?php
require_once 'Database.php';

$orders = Database::getAllOrders();
echo json_encode($orders);
?>