CREATE USER test_user WITH PASSWORD 'test_password';
CREATE DATABASE scout_toolkit_test OWNER test_user;

\connect scout_toolkit_test
GRANT ALL ON SCHEMA public TO test_user;
ALTER SCHEMA public OWNER TO test_user;
