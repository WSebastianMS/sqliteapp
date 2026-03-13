import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Link } from 'expo-router';
import { db, initDB } from '../database';


type Programa = { codigo: string; nombre: string };
type Estudiante = { codigo: string; nombre: string; email: string; programa_cod: string };

export default function ProgramasScreen() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(false);


  const [programaExpandido, setProgramaExpandido] = useState<string | null>(null);
  const [estudiantesDelPrograma, setEstudiantesDelPrograma] = useState<Estudiante[]>([]);

  useEffect(() => {
    initDB();
    cargarProgramas();
  }, []);

  const cargarProgramas = (termino = '') => {
    let result;
    if (termino) {
      result = db.getAllSync<Programa>(
        'SELECT * FROM programas WHERE codigo LIKE ? OR nombre LIKE ?',
        [`%${termino}%`, `%${termino}%`]
      );
    } else {
      result = db.getAllSync<Programa>('SELECT * FROM programas');
    }
    setProgramas(result);
  };


  const toggleExpandir = (codigoPrograma: string) => {
    if (programaExpandido === codigoPrograma) {
      // Si tocamos el que ya está abierto, lo cerramos
      setProgramaExpandido(null);
      setEstudiantesDelPrograma([]);
    } else {
      // Si tocamos uno nuevo, lo abrimos y buscamos sus estudiantes
      setProgramaExpandido(codigoPrograma);
      const result = db.getAllSync<Estudiante>(
        'SELECT * FROM estudiantes WHERE programa_cod = ?',
        [codigoPrograma]
      );
      setEstudiantesDelPrograma(result);
    }
  };

  const validarCampos = () => {
    if (!codigo.trim() || !nombre.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return false;
    }
    if (codigo.length > 4) {
      Alert.alert('Error', 'El código no puede superar los 4 caracteres.');
      return false;
    }
    if (nombre.length > 30) {
      Alert.alert('Error', 'El nombre no puede superar los 30 caracteres.');
      return false;
    }
    return true;
  };

  const guardarPrograma = () => {
    if (!validarCampos()) return;
    
    try {
      if (editando) {
        db.runSync('UPDATE programas SET nombre = ? WHERE codigo = ?', [nombre.trim(), codigo.trim()]);
        setEditando(false);
      } else {
        db.runSync('INSERT INTO programas (codigo, nombre) VALUES (?, ?)', [codigo.trim(), nombre.trim()]);
      }
      setCodigo('');
      setNombre('');
      cargarProgramas();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar. Revisa que el código no esté duplicado.');
    }
  };

  const editarPrograma = (prog: Programa) => {
    setCodigo(prog.codigo);
    setNombre(prog.nombre);
    setEditando(true);
  };

  const eliminarPrograma = (cod: string) => {
    Alert.alert('Confirmar', '¿Seguro que deseas eliminar este programa? Se eliminarán también los estudiantes asociados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          db.runSync('DELETE FROM programas WHERE codigo = ?', [cod]);
          // Si eliminamos el programa que estaba expandido, lo cerramos
          if (programaExpandido === cod) {
            setProgramaExpandido(null);
          }
          cargarProgramas();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <Link href="/estudiantes" asChild>
          <TouchableOpacity style={styles.botonVolver}>
            <Text style={styles.textoVolver}>Ir a Estudiantes →</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.title}>Gestión de Programas</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código del Programa</Text>
            <TextInput style={[styles.input, editando && styles.disabledInput]} placeholder="Ej: P005" value={codigo} onChangeText={setCodigo} maxLength={4} editable={!editando} autoCapitalize="characters" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Programa</Text>
            <TextInput style={styles.input} placeholder="Ej: Ingeniería de Sistemas" value={nombre} onChangeText={setNombre} maxLength={30} />
          </View>

          <View style={styles.botonesContainer}>
            <TouchableOpacity style={styles.botonPrimario} onPress={guardarPrograma}>
              <Text style={styles.textoBotonPrimario}>{editando ? "Actualizar Nombre" : "Crear Programa"}</Text>
            </TouchableOpacity>
            
            {editando && (
              <TouchableOpacity style={styles.botonSecundario} onPress={() => { setEditando(false); setCodigo(''); setNombre(''); }}>
                <Text style={styles.textoBotonSecundario}>Cancelar Edición</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TextInput style={styles.searchInput} placeholder="Buscar por código o nombre..." value={busqueda} onChangeText={(text) => { setBusqueda(text); cargarProgramas(text); }} />

        <FlatList
          data={programas}
          keyExtractor={(item) => item.codigo}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              {/* Tarjeta principal del programa */}
              <View style={styles.card}>
                <TouchableOpacity 
                  style={{ flex: 1 }} 
                  onPress={() => toggleExpandir(item.codigo)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardTitle}>[{item.codigo}]</Text>
                  <Text style={styles.cardSubtitle}>{item.nombre}</Text>
                  {/* Indicador visual de expansión */}
                  <Text style={styles.textoExpandir}>
                    {programaExpandido === item.codigo ? 'Ocultar estudiantes ▲' : 'Ver estudiantes ▼'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => editarPrograma(item)}>
                    <Text style={styles.actionTextEdit}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => eliminarPrograma(item.codigo)}>
                    <Text style={styles.actionTextDelete}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sección desplegable con la lista de estudiantes */}
              {programaExpandido === item.codigo && (
                <View style={styles.estudiantesContainer}>
                  {estudiantesDelPrograma.length > 0 ? (
                    estudiantesDelPrograma.map((estudiante) => (
                      <View key={estudiante.codigo} style={styles.estudianteItem}>
                        <Text style={styles.estudianteNombre}>• {estudiante.nombre}</Text>
                        <Text style={styles.estudianteEmail}>{estudiante.email}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.sinEstudiantes}>No hay estudiantes registrados en este programa.</Text>
                  )}
                </View>
              )}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ESTILOS UNIFICADOS
const colores = {
  rojoPrimario: '#C4142B', 
  fondoApp: '#FAFAFA',      
  textoOscuro: '#222222',
  textoGris: '#555555',
  bordeGris: '#DCDCDC',
  blanco: '#FFFFFF',
  azulInput: '#F0F4F8',
  fondoEstudiantes: '#F9ECEC'
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colores.fondoApp, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, padding: 24, backgroundColor: colores.fondoApp },
  botonVolver: { marginBottom: 15, alignSelf: 'flex-end' },
  textoVolver: { color: colores.rojoPrimario, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', color: colores.textoOscuro, marginBottom: 20 },
  form: { marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: colores.textoOscuro, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.bordeGris, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 6, fontSize: 16, color: colores.textoOscuro },
  disabledInput: { backgroundColor: colores.azulInput, color: '#888' },
  botonesContainer: { marginTop: 10, gap: 10 },
  botonPrimario: { backgroundColor: colores.rojoPrimario, paddingVertical: 14, borderRadius: 6, alignItems: 'center', shadowColor: colores.rojoPrimario, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  textoBotonPrimario: { color: colores.blanco, fontSize: 16, fontWeight: 'bold' },
  botonSecundario: { backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: colores.rojoPrimario },
  textoBotonSecundario: { color: colores.rojoPrimario, fontSize: 16, fontWeight: 'bold' },
  searchInput: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.bordeGris, padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 16 },
  
  // Estilos actualizados para la tarjeta y la sub-lista
  cardContainer: {
    marginBottom: 12,
    backgroundColor: colores.blanco,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: { 
    flexDirection: 'row', 
    padding: 16, 
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colores.rojoPrimario, 
  },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: colores.textoOscuro, marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: colores.textoOscuro },
  textoExpandir: { fontSize: 12, color: colores.rojoPrimario, marginTop: 8, fontWeight: '600' },
  cardActions: { justifyContent: 'space-between', gap: 10 },
  actionButton: { padding: 5 },
  actionTextEdit: { color: colores.textoGris, fontWeight: '600', fontSize: 14 },
  actionTextDelete: { color: colores.rojoPrimario, fontWeight: 'bold', fontSize: 14 },
  
  // Estilos de la zona desplegable
  estudiantesContainer: {
    backgroundColor: colores.fondoEstudiantes,
    padding: 15,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0d9d9'
  },
  estudianteItem: {
    marginBottom: 8,
  },
  estudianteNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colores.textoOscuro,
  },
  estudianteEmail: {
    fontSize: 13,
    color: colores.textoGris,
    marginLeft: 10,
  },
  sinEstudiantes: {
    fontSize: 14,
    color: colores.textoGris,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  }
});
