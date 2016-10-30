# API  DATASET BANCOMER 

## endpoints

### /t{params} 

Regresa data acerca del numero de afiliado pedido.

Parametros:
- client: ID de afiliacion
- initDate: Fecha de inicio de muestra (YYYY-MM-DD)
- endDate: Fecha de fin de muestra (YYYY-MM-DD)

> GET /t?client=6996&initDate=2015-12-01&endDate=2016-03-01 HTTP/1.1