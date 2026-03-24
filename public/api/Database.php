<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class Database {
    private static $host = "localhost";
    private static $user = "root";
    private static $pass = "";
    private static $db = "sistema_reparaciones";
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn === null) {
            self::$conn = new mysqli(self::$host, self::$user, self::$pass, self::$db);
            if (self::$conn->connect_error) {
                die(json_encode(["error" => "Conexión fallida: " . self::$conn->connect_error]));
            }
            self::$conn->set_charset("utf8mb4");
        }
        return self::$conn;
    }

    public static function getAllOrders() {
        $conn = self::getConnection();
        $query = "SELECT 
                    o.id as order_id, o.numero_orden, o.falla_reportada, o.costo_total_reparacion, o.abono_inicial, o.estado as order_status, o.fecha_creacion, o.eliminado,
                    d.id as device_id, d.marca, d.modelo, d.imei_sn, d.tipo_dispositivo, d.estado_fisico,
                    c.id as customer_id, c.nombre_completo, c.cedula, c.telefono, c.direccion, c.email
                  FROM ordenes_servicio o
                  INNER JOIN dispositivos d ON o.id_dispositivo = d.id
                  INNER JOIN clientes c ON d.id_cliente = c.id
                  WHERE o.eliminado = 0
                  ORDER BY o.fecha_creacion DESC";
        
        $result = $conn->query($query);
        $orders = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                // Get evidence photos for each order
                $photos = [];
                $photoQuery = "SELECT etapa, url_foto FROM fotos_evidencia WHERE id_orden = " . $row['order_id'];
                $photoResult = $conn->query($photoQuery);
                while($photoRow = $photoResult->fetch_assoc()) {
                    $photos[] = [
                        'stage' => $photoRow['etapa'],
                        'url' => $photoRow['url_foto']
                    ];
                }

                $orders[] = [
                    'id' => (string)$row['order_id'],
                    'orderNumber' => $row['numero_orden'],
                    'customer' => [
                        'fullName' => $row['nombre_completo'],
                        'documentId' => $row['cedula'],
                        'phone' => $row['telefono'],
                        'address' => $row['direccion'],
                        'email' => $row['email']
                    ],
                    'device' => [
                        'brand' => $row['marca'],
                        'model' => $row['modelo'],
                        'serialNumber' => $row['imei_sn'],
                        'deviceType' => $row['tipo_dispositivo'],
                        'physicalCondition' => $row['estado_fisico']
                    ],
                    'repair' => [
                        'reportedIssue' => $row['falla_reportada'],
                        'evidencePhotos' => $photos,
                        'initialDeposit' => (float)$row['abono_inicial'],
                        'repairTotalCost' => (float)$row['costo_total_reparacion']
                    ],
                    'status' => $row['order_status'],
                    'createdAt' => $row['fecha_creacion'],
                    'deleted' => (bool)$row['eliminado']
                ];
            }
        }
        return $orders;
    }

    public static function saveOrder($data) {
        $conn = self::getConnection();
        $conn->begin_transaction();

        try {
            $customer = $data['customer'];
            $device = $data['device'];
            $repair = $data['repair'];
            $orderNumber = $data['orderNumber'] ?? 'REP-' . mt_rand(100000, 999999);

            // 1. Insert/Update Customer (Mapeo: fullName -> nombre_completo, documentId -> cedula)
            $stmt = $conn->prepare("INSERT INTO clientes (nombre_completo, cedula, telefono, direccion, email) 
                                    VALUES (?, ?, ?, ?, ?) 
                                    ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id), nombre_completo=VALUES(nombre_completo), telefono=VALUES(telefono), direccion=VALUES(direccion), email=VALUES(email)");
            $stmt->bind_param("sssss", $customer['fullName'], $customer['documentId'], $customer['phone'], $customer['address'], $customer['email']);
            if (!$stmt->execute()) {
                throw new Exception("Error al insertar cliente: " . $stmt->error);
            }
            $customerId = $conn->insert_id;

            // 2. Insert Device (Mapeo: serialNumber -> imei_sn, physicalCondition -> estado_fisico)
            $stmt = $conn->prepare("INSERT INTO dispositivos (id_cliente, marca, modelo, imei_sn, tipo_dispositivo, estado_fisico) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isssss", $customerId, $device['brand'], $device['model'], $device['serialNumber'], $device['deviceType'], $device['physicalCondition']);
            if (!$stmt->execute()) {
                throw new Exception("Error al insertar dispositivo: " . $stmt->error);
            }
            $deviceId = $conn->insert_id;

            // 3. Insert Order (Sincronizado con IDs autoincrementales)
            $initialDeposit = !empty($repair['initialDeposit']) ? (float)$repair['initialDeposit'] : 0.0;
            $totalCost = !empty($repair['repairTotalCost']) ? (float)$repair['repairTotalCost'] : 0.0;
            $status = 'recibido';

            $stmt = $conn->prepare("INSERT INTO ordenes_servicio (numero_orden, id_dispositivo, falla_reportada, costo_total_reparacion, abono_inicial, estado) 
                                    VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sisdds", $orderNumber, $deviceId, $repair['reportedIssue'], $totalCost, $initialDeposit, $status);
            if (!$stmt->execute()) {
                throw new Exception("Error al insertar orden: " . $stmt->error);
            }
            $orderId = $conn->insert_id;

            // 4. Evidence Photos
            if (!empty($repair['evidencePhotos'])) {
                $stmtFoto = $conn->prepare("INSERT INTO fotos_evidencia (id_orden, etapa, url_foto) VALUES (?, ?, ?)");
                foreach ($repair['evidencePhotos'] as $foto) {
                    $stmtFoto->bind_param("iss", $orderId, $foto['stage'], $foto['url']);
                    $stmtFoto->execute();
                }
            }

            $conn->commit();
            return ["status" => "success", "id" => (string)$orderId, "orderNumber" => $orderNumber];
        } catch (Exception $e) {
            $conn->rollback();
            error_log("DATABASE ERROR: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    public static function getAllPayments() {
        $conn = self::getConnection();
        
        // Crear tabla si no existe para evitar errores inmediatos
        $conn->query("CREATE TABLE IF NOT EXISTS transacciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fecha DATETIME NOT NULL,
            monto DECIMAL(10,2) NOT NULL,
            metodo VARCHAR(50) NOT NULL,
            categoria VARCHAR(50) NOT NULL,
            tipo_transaccion VARCHAR(20) NOT NULL,
            descripcion TEXT,
            id_orden_relacionada VARCHAR(50),
            numero_venta VARCHAR(50),
            datos_cliente TEXT,
            items_venta TEXT
        )");

        // Add missing columns if table already existed without them
        $columns = [
            'categoria' => "VARCHAR(50) NOT NULL DEFAULT 'otro'",
            'tipo_transaccion' => "VARCHAR(20) NOT NULL DEFAULT 'ingreso'",
            'id_orden_relacionada' => "VARCHAR(50)",
            'numero_venta' => "VARCHAR(50)",
            'datos_cliente' => "TEXT",
            'items_venta' => "TEXT",
            'metodo' => "VARCHAR(50) NOT NULL DEFAULT 'efectivo'"
        ];

        foreach ($columns as $col => $def) {
            $check = $conn->query("SHOW COLUMNS FROM transacciones LIKE '$col'");
            if ($check && $check->num_rows === 0) {
                $conn->query("ALTER TABLE transacciones ADD COLUMN $col $def");
            }
        }

        $query = "SELECT * FROM transacciones ORDER BY fecha DESC";
        $result = $conn->query($query);
        $payments = [];
        
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $payment = [
                    'id' => (string)$row['id'],
                    'date' => str_replace(' ', 'T', $row['fecha']) . '.000Z', // Formato ISO en frontend
                    'amount' => (float)$row['monto'],
                    'method' => $row['metodo'],
                    'type' => $row['categoria'],
                    'transactionType' => $row['tipo_transaccion'],
                    'description' => $row['descripcion']
                ];

                if (!empty($row['id_orden_relacionada'])) {
                    $payment['orderId'] = $row['id_orden_relacionada'];
                }
                if (!empty($row['numero_venta'])) {
                    $payment['saleNumber'] = $row['numero_venta'];
                }
                if (!empty($row['datos_cliente'])) {
                    $payment['customer'] = json_decode($row['datos_cliente'], true);
                }
                if (!empty($row['items_venta'])) {
                    $payment['items'] = json_decode($row['items_venta'], true);
                }
                
                $payments[] = $payment;
            }
        }
        return $payments;
    }

    public static function savePayment($data) {
        $conn = self::getConnection();
        
        // Crear tabla automáticamente
        $conn->query("CREATE TABLE IF NOT EXISTS transacciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fecha DATETIME NOT NULL,
            monto DECIMAL(10,2) NOT NULL,
            metodo VARCHAR(50) NOT NULL,
            categoria VARCHAR(50) NOT NULL,
            tipo_transaccion VARCHAR(20) NOT NULL,
            descripcion TEXT,
            id_orden_relacionada VARCHAR(50),
            numero_venta VARCHAR(50),
            datos_cliente TEXT,
            items_venta TEXT
        )");

        // Add missing columns if table already existed without them
        $columns = [
            'categoria' => "VARCHAR(50) NOT NULL DEFAULT 'otro'",
            'tipo_transaccion' => "VARCHAR(20) NOT NULL DEFAULT 'ingreso'",
            'id_orden_relacionada' => "VARCHAR(50)",
            'numero_venta' => "VARCHAR(50)",
            'datos_cliente' => "TEXT",
            'items_venta' => "TEXT",
            'metodo' => "VARCHAR(50) NOT NULL DEFAULT 'efectivo'"
        ];

        foreach ($columns as $col => $def) {
            $check = $conn->query("SHOW COLUMNS FROM transacciones LIKE '$col'");
            if ($check && $check->num_rows === 0) {
                $conn->query("ALTER TABLE transacciones ADD COLUMN $col $def");
            }
        }

        try {
            $fecha = date('Y-m-d H:i:s'); // Si no viene la fecha, poner actual
            $monto = (float)$data['amount'];
            $metodo = $data['method'];
            $categoria = $data['type'];
            $tipo_transaccion = $data['transactionType'];
            $descripcion = $data['description'];
            $id_orden_relacionada = $data['orderId'] ?? null;
            $numero_venta = $data['saleNumber'] ?? null;
            
            $datos_cliente = null;
            if (isset($data['customer'])) {
                $datos_cliente = json_encode($data['customer']);
            }
            
            $items_venta = null;
            if (isset($data['items'])) {
                $items_venta = json_encode($data['items']);
            }

            $stmt = $conn->prepare("INSERT INTO transacciones (fecha, monto, metodo, categoria, tipo_transaccion, descripcion, id_orden_relacionada, numero_venta, datos_cliente, items_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->bind_param("sdssssssss", $fecha, $monto, $metodo, $categoria, $tipo_transaccion, $descripcion, $id_orden_relacionada, $numero_venta, $datos_cliente, $items_venta);
            
            if (!$stmt->execute()) {
                throw new Exception("Error al insertar transaccion: " . $stmt->error);
            }
            $insertId = $conn->insert_id;
            
            return ["status" => "success", "id" => (string)$insertId];
        } catch (Exception $e) {
            error_log("DATABASE ERROR (PAYMENTS): " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }
}
?>