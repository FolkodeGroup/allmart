-- 1. Crear la función generadora de UUIDv7 secuenciales basado en tiempo
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid AS $$
DECLARE
    timestamp_ms bigint;
    timestamp_hex varchar;
    random_hex varchar;
    uuid_str varchar;
BEGIN
    -- Obtener la época de Unix actual en milisegundos
    timestamp_ms := floor(extract(epoch from clock_timestamp()) * 1000);
    
    -- Formatear a cadena hexadecimal de 12 caracteres (48 bits de timestamp)
    timestamp_hex := lpad(to_hex(timestamp_ms), 12, '0');
    
    -- Generar entropía aleatoria md5 de 32 caracteres (suficiente para 74 bits restantes)
    random_hex := md5(random()::text || clock_timestamp()::text);
    
    -- Ensamblar el UUID cumpliendo estrictamente con la especificación RFC 9562 (versión 7, variante 8)
    -- Formato estándar: 8-4-4-4-12
    uuid_str := substring(timestamp_hex from 1 for 8) || '-' ||
                substring(timestamp_hex from 9 for 4) || '-' ||
                '7' || substring(random_hex from 14 for 3) || '-' ||
                '8' || substring(random_hex from 18 for 3) || '-' ||
                substring(random_hex from 21 for 12);
                
    RETURN uuid_str::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;