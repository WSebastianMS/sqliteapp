import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Link } from 'expo-router';
import { db } from '../database';

type Estudiante = { codigo: string; nombre: string; email: string; programa_cod: string };

export default function EstudiantesScreen() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [programaCod, setProgramaCod] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = (termino = '') => {
    let result;
    if (termino) {
      result = db.getAllSync<Estudiante>(
        'SELECT * FROM estudiantes WHERE codigo LIKE ? OR nombre LIKE ?',
        [`%${termino}%`, `%${termino}%`]
      );
    } else {
      result = db.getAllSync<Estudiante>('SELECT * FROM estudiantes');
    }
    setEstudiantes(result);
  };

  const validarCampos = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    
    if (!codigo.trim() || !nombre.trim() || !email.trim() || !programaCod.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }
    if (codigo.length > 4 || programaCod.length > 4) {
      Alert.alert('Error', 'Los códigos no pueden superar los 4 caracteres.');
      return false;
    }
    return true;
  };

  const guardarEstudiante = () => {
    if (!validarCampos()) return;

    try {
      if (editando) {
        db.runSync('UPDATE estudiantes SET nombre = ?, email = ? WHERE codigo = ?', [nombre.trim(), email.trim(), codigo.trim()]);
        setEditando(false);
      } else {
        db.runSync(
          'INSERT INTO estudiantes (codigo, nombre, email, programa_cod) VALUES (?, ?, ?, ?)', 
          [codigo.trim(), nombre.trim(), email.trim(), programaCod.trim()]
        );
      }
      limpiarFormulario();
      cargarEstudiantes();
    } catch (error) {
      Alert.alert('Error', 'Verifica que el código del programa exista y que el código de estudiante no esté duplicado.');
    }
  };

  const limpiarFormulario = () => {
    setCodigo(''); setNombre(''); setEmail(''); setProgramaCod(''); setEditando(false);
  };

  const editarEstudiante = (est: Estudiante) => {
    setCodigo(est.codigo);
    setNombre(est.nombre);
    setEmail(est.email);
    setProgramaCod(est.programa_cod);
    setEditando(true);
  };

  const eliminarEstudiante = (cod: string) => {
    Alert.alert('Confirmar', '¿Eliminar este estudiante?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          db.runSync('DELETE FROM estudiantes WHERE codigo = ?', [cod]);
          cargarEstudiantes();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <Link href="/" asChild>
          <TouchableOpacity style={styles.botonVolver}>
            <Text style={styles.textoVolver}>← Volver a Programas</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.title}>Gestión de Estudiantes</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código Estudiante</Text>
            <TextInput style={[styles.input, editando && styles.disabledInput]} placeholder="Ej: E005" value={codigo} onChangeText={setCodigo} maxLength={4} editable={!editando} autoCapitalize="characters" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput style={styles.input} placeholder="Ej: Juan Pérez" value={nombre} onChangeText={setNombre} maxLength={30} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput style={styles.input} placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} maxLength={100} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de Programa</Text>
            <TextInput style={[styles.input, editando && styles.disabledInput]} placeholder="Ej: P001" value={programaCod} onChangeText={setProgramaCod} maxLength={4} editable={!editando} autoCapitalize="characters" />
          </View>
          
          <View style={styles.botonesContainer}>
            <TouchableOpacity style={styles.botonPrimario} onPress={guardarEstudiante}>
              <Text style={styles.textoBotonPrimario}>{editando ? "Actualizar Datos" : "Registrar Estudiante"}</Text>
            </TouchableOpacity>
            
            {editando && (
              <TouchableOpacity style={styles.botonSecundario} onPress={limpiarFormulario}>
                <Text style={styles.textoBotonSecundario}>Cancelar Edición</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TextInput style={styles.searchInput} placeholder="Buscar por código o nombre..." value={busqueda} onChangeText={(text) => { setBusqueda(text); cargarEstudiantes(text); }} />

        <FlatList
          data={estudiantes}
          keyExtractor={(item) => item.codigo}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>[{item.codigo}] {item.nombre}</Text>
                <Text style={styles.cardSubtitle}>Programa: {item.programa_cod}</Text>
                <Text style={styles.cardEmail}>{item.email}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => editarEstudiante(item)}>
                  <Text style={styles.actionTextEdit}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => eliminarEstudiante(item.codigo)}>
                  <Text style={styles.actionTextDelete}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

// ESTILOS BASADOS EN LA IMAGEN DE UTEPSA
const colores = {
  rojoPrimario: '#C4142B', // Rojo sacado de la imagen
  fondoApp: '#FAFAFA',      // Gris muy clarito/blanco de la derecha
  textoOscuro: '#222222',
  textoGris: '#555555',
  bordeGris: '#DCDCDC',
  blanco: '#FFFFFF',
  azulInput: '#F0F4F8'      // Como el campo de contraseña de tu imagen
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: colores.fondoApp, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
  },
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: colores.fondoApp 
  },
  botonVolver: {
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  textoVolver: {
    color: colores.textoGris,
    fontSize: 16,
    fontWeight: '500',
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: colores.textoOscuro,
    marginBottom: 20, 
  },
  form: { 
    marginBottom: 20, 
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: colores.textoOscuro,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: { 
    backgroundColor: colores.blanco,
    borderWidth: 1, 
    borderColor: colores.bordeGris, 
    paddingHorizontal: 15, 
    paddingVertical: 12, // Inputs más altos y cómodos
    borderRadius: 6,
    fontSize: 16,
    color: colores.textoOscuro,
  },
  disabledInput: { 
    backgroundColor: colores.azulInput, // Colorcito sutil para cuando no se puede editar
    color: '#888' 
  },
  botonesContainer: {
    marginTop: 10,
    gap: 10,
  },
  botonPrimario: {
    backgroundColor: colores.rojoPrimario,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: colores.rojoPrimario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  textoBotonPrimario: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonSecundario: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colores.rojoPrimario,
  },
  textoBotonSecundario: {
    color: colores.rojoPrimario,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchInput: { 
    backgroundColor: colores.blanco,
    borderWidth: 1, 
    borderColor: colores.bordeGris, 
    padding: 12, 
    borderRadius: 6, 
    marginBottom: 20,
    fontSize: 16,
  },
  card: { 
    flexDirection: 'row', 
    backgroundColor: colores.blanco, 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 12, 
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colores.rojoPrimario, // Un detalle visual bonito a la izquierda
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: colores.textoOscuro,
    marginBottom: 2,
  },
  cardSubtitle: { 
    fontSize: 13, 
    color: colores.textoGris,
    marginBottom: 2,
  },
  cardEmail: {
    fontSize: 13,
    color: '#888',
  },
  cardActions: {
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
  actionTextEdit: { 
    color: colores.textoGris, 
    fontWeight: '600',
    fontSize: 14,
  },
  actionTextDelete: { 
    color: colores.rojoPrimario, 
    fontWeight: 'bold',
    fontSize: 14,
  }
});