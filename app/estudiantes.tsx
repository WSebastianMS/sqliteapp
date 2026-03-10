import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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

  const guardarEstudiante = () => {
    if (!codigo || !nombre || !email || !programaCod) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
    try {
      if (editando) {
        // Solo se puede modificar nombre y email según tus requisitos
        db.runSync('UPDATE estudiantes SET nombre = ?, email = ? WHERE codigo = ?', [nombre, email, codigo]);
        setEditando(false);
      } else {
        // Verificar primero si el programa existe (Foreign Key Constraint)
        db.runSync(
          'INSERT INTO estudiantes (codigo, nombre, email, programa_cod) VALUES (?, ?, ?, ?)', 
          [codigo, nombre, email, programaCod]
        );
      }
      limpiarFormulario();
      cargarEstudiantes();
    } catch (error) {
      Alert.alert('Error', 'Asegúrate de que el código de programa exista y el código de estudiante no esté duplicado.');
    }
  };

  const limpiarFormulario = () => {
    setCodigo(''); setNombre(''); setEmail(''); setProgramaCod(''); setEditando(false);
  }

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
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Estudiantes</Text>

      <View style={styles.form}>
        <TextInput style={[styles.input, editando && styles.disabledInput]} placeholder="Código Estudiante (Ej: E001)" value={codigo} onChangeText={setCodigo} maxLength={4} editable={!editando} />
        <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} maxLength={30} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} maxLength={100} keyboardType="email-address" />
        <TextInput style={[styles.input, editando && styles.disabledInput]} placeholder="Código de Programa (Ej: P001)" value={programaCod} onChangeText={setProgramaCod} maxLength={4} editable={!editando} />
        
        <Button title={editando ? "Actualizar Datos" : "Registrar Estudiante"} onPress={guardarEstudiante} />
        {editando && <Button title="Cancelar" color="red" onPress={limpiarFormulario} />}
      </View>

      <TextInput style={styles.searchInput} placeholder="Buscar por código o nombre..." value={busqueda} onChangeText={(text) => { setBusqueda(text); cargarEstudiantes(text); }} />

      <FlatList
        data={estudiantes}
        keyExtractor={(item) => item.codigo}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>[{item.codigo}] {item.nombre}</Text>
              <Text style={{ fontSize: 12, color: '#555' }}>{item.email} | Prog: {item.programa_cod}</Text>
            </View>
            <TouchableOpacity onPress={() => editarEstudiante(item)}><Text style={styles.actionText}>Editar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => eliminarEstudiante(item.codigo)}><Text style={[styles.actionText, { color: 'red' }]}>Eliminar</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// Puedes reutilizar los mismos estilos que pusimos en index.tsx aquí
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  form: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15, gap: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
  disabledInput: { backgroundColor: '#e0e0e0', color: '#888' },
  searchInput: { borderWidth: 1, borderColor: '#007BFF', padding: 10, borderRadius: 5, marginBottom: 15, backgroundColor: 'white' },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 5, marginBottom: 10, alignItems: 'center', gap: 10 },
  actionText: { color: '#007BFF', fontWeight: 'bold' }
});