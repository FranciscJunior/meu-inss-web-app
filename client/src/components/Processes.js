import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';

const Processes = () => {
  const [processes, setProcesses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProcesses, setTotalProcesses] = useState(0);

  const [formData, setFormData] = useState({
    client_id: '',
    process_number: '',
    process_type: '',
    status: 'em_andamento',
    description: '',
    initial_date: '',
    final_date: '',
    value: '',
    observations: ''
  });

  useEffect(() => {
    fetchProcesses();
    fetchClients();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/processes', {
        params: {
          search,
          status: statusFilter,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setProcesses(response.data.processes);
      setTotalProcesses(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);
      setError('Erro ao carregar processos');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients', { params: { limit: 1000 } });
      setClients(response.data.clients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const handleOpenDialog = (process = null) => {
    if (process) {
      setEditingProcess(process);
      setFormData(process);
    } else {
      setEditingProcess(null);
      setFormData({
        client_id: '',
        process_number: '',
        process_type: '',
        status: 'em_andamento',
        description: '',
        initial_date: '',
        final_date: '',
        value: '',
        observations: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProcess(null);
    setFormData({
      client_id: '',
      process_number: '',
      process_type: '',
      status: 'em_andamento',
      description: '',
      initial_date: '',
      final_date: '',
      value: '',
      observations: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingProcess) {
        await axios.put(`/api/processes/${editingProcess.id}`, formData);
      } else {
        await axios.post('/api/processes', formData);
      }
      handleCloseDialog();
      fetchProcesses();
    } catch (error) {
      console.error('Erro ao salvar processo:', error);
      setError(error.response?.data?.error || 'Erro ao salvar processo');
    }
  };

  const handleDelete = async (processId) => {
    if (window.confirm('Tem certeza que deseja deletar este processo?')) {
      try {
        await axios.delete(`/api/processes/${processId}`);
        fetchProcesses();
      } catch (error) {
        console.error('Erro ao deletar processo:', error);
        setError(error.response?.data?.error || 'Erro ao deletar processo');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'em_andamento': return 'primary';
      case 'concluido': return 'success';
      case 'suspenso': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'suspenso': return 'Suspenso';
      default: return status;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Processos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Processo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar processos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="em_andamento">Em Andamento</MenuItem>
                  <MenuItem value="concluido">Concluído</MenuItem>
                  <MenuItem value="suspenso">Suspenso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data Inicial</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : processes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum processo encontrado
                </TableCell>
              </TableRow>
            ) : (
              processes.map((process) => (
                <TableRow key={process.id}>
                  <TableCell>{process.process_number}</TableCell>
                  <TableCell>{process.client_name}</TableCell>
                  <TableCell>{process.process_type}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(process.status)}
                      color={getStatusColor(process.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{process.initial_date}</TableCell>
                  <TableCell>
                    {process.value ? `R$ ${parseFloat(process.value).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(process)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(process.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalProcesses}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProcess ? 'Editar Processo' : 'Novo Processo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formData.client_id}
                  label="Cliente"
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número do Processo"
                value={formData.process_number}
                onChange={(e) => setFormData({ ...formData, process_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tipo de Processo"
                value={formData.process_type}
                onChange={(e) => setFormData({ ...formData, process_type: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="em_andamento">Em Andamento</MenuItem>
                  <MenuItem value="concluido">Concluído</MenuItem>
                  <MenuItem value="suspenso">Suspenso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data Inicial"
                type="date"
                value={formData.initial_date}
                onChange={(e) => setFormData({ ...formData, initial_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data Final"
                type="date"
                value={formData.final_date}
                onChange={(e) => setFormData({ ...formData, final_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProcess ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Processes; 