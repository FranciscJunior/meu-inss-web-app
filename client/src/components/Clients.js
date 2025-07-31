import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Alert, CircularProgress, Grid, Divider, Card, CardContent, CardActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Visibility as ViewIcon, PhotoCamera as PhotoIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [search, setSearch] = useState('');
  const [totalClients, setTotalClients] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    name: '', cpf: '', rg: '', phone: '', email: '', address: '', city: '', state: '', cep: '', birth_date: '',
    process_type: '', process_number: '', protocol_number: '', inss_password: '',
    lawyer_name: '', indication: '', registration_date: '', contract_value: '', photo_url: ''
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoZoomDialog, setPhotoZoomDialog] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState('');

  useEffect(() => {
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/clients', {
        params: {
          search,
          page: 1, // Assuming page 1 for now, as pagination is removed
          limit: 100 // Assuming a large limit for now
        }
      });
      setClients(response.data.clients);
      setTotalClients(response.data.pagination.total);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      
      // Trata o valor do contrato - se for maior que 1000, converte de centavos para reais
      let contractValue = client.contract_value || '';
      if (contractValue && parseFloat(contractValue) > 1000) {
        contractValue = (parseFloat(contractValue) / 100).toString();
      }
      
      // Formata CPF, telefone e número do processo
      const formatCPFValue = client.cpf ? formatCPF(client.cpf.replace(/\D/g, '')) : '';
      const formatPhoneValue = client.phone ? formatPhone(client.phone.replace(/\D/g, '')) : '';
      const formatProcessValue = client.process_number ? formatProcessNumber(client.process_number.replace(/\D/g, '')) : '';
      
      setFormData({
        name: client.name || '',
        cpf: formatCPFValue,
        rg: client.rg || '',
        phone: formatPhoneValue,
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        cep: client.cep || '',
        birth_date: client.birth_date || '',
        process_type: client.process_type || '',
        process_number: formatProcessValue,
        protocol_number: client.protocol_number || '',
        inss_password: client.inss_password || '',
        lawyer_name: client.lawyer_name || '',
        indication: client.indication || '',
        registration_date: client.registration_date || '',
        contract_value: contractValue,
        photo_url: client.photo_url || ''
      });
      setPhotoPreview(client.photo_url || '');
    } else {
      setEditingClient(null);
      setFormData({
        name: '', cpf: '', rg: '', phone: '', email: '', address: '', city: '', state: '', cep: '', birth_date: '',
        process_type: '', process_number: '', protocol_number: '', inss_password: '',
        lawyer_name: '', indication: '', registration_date: '', contract_value: '', photo_url: ''
      });
      setPhotoPreview('');
    }
    setOpenDialog(true);
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setViewDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setViewDialog(false);
    setEditingClient(null);
    setSelectedClient(null);
    setFormData({
      name: '', cpf: '', rg: '', phone: '', email: '', address: '', city: '', state: '', cep: '', birth_date: '',
      process_type: '', process_number: '', protocol_number: '', inss_password: '',
      lawyer_name: '', indication: '', registration_date: '', contract_value: '', photo_url: ''
    });
    setSelectedPhoto(null);
    setPhotoPreview('');
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedPhoto);

      const response = await axios.post('/api/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData(prev => ({ ...prev, photo_url: response.data.photoUrl }));
      setUploadingPhoto(false);
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      setError('Erro ao fazer upload da foto');
      setUploadingPhoto(false);
    }
  };

  const handlePhotoZoom = (photoUrl) => {
    setZoomedPhoto(photoUrl);
    setPhotoZoomDialog(true);
  };

  const handleClosePhotoZoom = () => {
    setPhotoZoomDialog(false);
    setZoomedPhoto('');
  };

  const handleSubmit = async () => {
    try {
      const dataToSend = { ...formData };
      console.log('🚀 [SUBMIT] Dados do cliente:', dataToSend);
      console.log('🚀 [SUBMIT] Protocolo:', dataToSend.protocol_number);
      console.log('🚀 [SUBMIT] Editando cliente:', editingClient ? 'SIM' : 'NÃO');
      if (dataToSend.contract_value) {
        const reais = parseFloat(dataToSend.contract_value);
        if (!isNaN(reais)) {
          dataToSend.contract_value = (reais * 100).toString();
        }
      }
      if (dataToSend.cpf) { dataToSend.cpf = dataToSend.cpf.replace(/\D/g, ''); }
      if (dataToSend.phone) { dataToSend.phone = dataToSend.phone.replace(/\D/g, ''); }
      if (dataToSend.process_number) { dataToSend.process_number = dataToSend.process_number.replace(/\D/g, ''); }

      let response;
      if (editingClient) {
        console.log('🔄 [EDIT] Editando cliente existente');
        response = await axios.put(`/api/clients/${editingClient.id}`, dataToSend);
        console.log('✅ [EDIT] Cliente atualizado com sucesso');
        
        // Verificar se protocolo foi adicionado e criar agendamento INSS automaticamente
        console.log('🔍 [EDIT] Verificando protocolo:', dataToSend.protocol_number);
        if (dataToSend.protocol_number && dataToSend.protocol_number.trim() !== '') {
          console.log('✅ [EDIT] Protocolo válido detectado!');
          try {
            // Verificar se já existe um agendamento para este cliente
            const agendamentosResponse = await axios.get('/api/agendamentos-inss', {
              params: { search: dataToSend.name }
            });
            
            const agendamentoExistente = agendamentosResponse.data.find(
              ag => ag.client_name === dataToSend.name && ag.cpf === dataToSend.cpf
            );
            
            if (!agendamentoExistente) {
              console.log('✅ [EDIT] Criando agendamento com protocolo:', dataToSend.protocol_number);
              await axios.post('/api/agendamentos-inss', {
                client_name: dataToSend.name,
                cpf: dataToSend.cpf,
                phone: dataToSend.phone,
                email: dataToSend.email,
                protocol_number: dataToSend.protocol_number,
                appointment_date: '',
                appointment_time: '',
                appointment_type: 'INSS',
                location: '',
                status: 'agendado',
                notes: `Protocolo: ${dataToSend.protocol_number} - Cliente criado automaticamente`
              });
            }
          } catch (agendamentoError) {
            console.log('Erro ao criar agendamento automático:', agendamentoError);
          }
        }
      } else {
        response = await axios.post('/api/clients', dataToSend);
        
        // Verificar se protocolo foi adicionado e criar agendamento INSS automaticamente
        if (dataToSend.protocol_number && dataToSend.protocol_number.trim() !== '') {
          try {
            // Verificar se já existe um agendamento para este cliente
            const agendamentosResponse = await axios.get('/api/agendamentos-inss', {
              params: { search: dataToSend.name }
            });
            
            const agendamentoExistente = agendamentosResponse.data.find(
              ag => ag.client_name === dataToSend.name && ag.cpf === dataToSend.cpf
            );
            
            if (!agendamentoExistente) {
              console.log('✅ [NEW] Criando agendamento com protocolo:', dataToSend.protocol_number);
              await axios.post('/api/agendamentos-inss', {
                client_name: dataToSend.name,
                cpf: dataToSend.cpf,
                phone: dataToSend.phone,
                email: dataToSend.email,
                protocol_number: dataToSend.protocol_number,
                appointment_date: '',
                appointment_time: '',
                appointment_type: 'INSS',
                location: '',
                status: 'agendado',
                notes: `Protocolo: ${dataToSend.protocol_number} - Cliente criado automaticamente`
              });
            }
          } catch (agendamentoError) {
            console.log('Erro ao criar agendamento automático:', agendamentoError);
          }
        }
      }
      
      handleCloseDialog();
      fetchClients();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar cliente');
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await axios.delete(`/api/clients/${clientId}`);
        fetchClients();
      } catch (error) {
        setError('Erro ao excluir cliente');
      }
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return 'R$ 0,00';
    
    // Se o valor for maior que 1000, provavelmente está em centavos
    // Convertemos para reais dividindo por 100
    const reais = numericValue > 1000 ? numericValue / 100 : numericValue;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(reais);
  };

  const formatCurrencyInput = (value) => {
    // Remove tudo exceto números
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Converte para centavos
    const cents = parseInt(numericValue);
    const reais = cents / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(reais);
  };

  const formatCPF = (value) => {
    // Remove tudo exceto números
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Aplica máscara CPF: 000.000.000-00
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value) => {
    // Remove tudo exceto números
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Aplica máscara telefone: (00) 00000-0000
    return numericValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatProcessNumber = (value) => {
    // Remove tudo exceto números
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
    // Exemplo: 1234567-89.2023.1.12.3456
    
    let formatted = numericValue;
    
    // Aplica formatação baseada no comprimento
    if (formatted.length >= 7) {
      formatted = formatted.substring(0, 7) + '-' + formatted.substring(7);
    }
    if (formatted.length >= 10) {
      formatted = formatted.substring(0, 10) + '.' + formatted.substring(10);
    }
    if (formatted.length >= 15) {
      formatted = formatted.substring(0, 15) + '.' + formatted.substring(15);
    }
    if (formatted.length >= 17) {
      formatted = formatted.substring(0, 17) + '.' + formatted.substring(17);
    }
    if (formatted.length >= 20) {
      formatted = formatted.substring(0, 20) + '.' + formatted.substring(20);
    }
    
    return formatted;
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    const reais = numericValue / 100;
    
    setFormData(prev => ({
      ...prev,
      contract_value: reais > 0 ? reais.toString() : ''
    }));
  };

  const handleCPFChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatCPF(value);
    
    setFormData(prev => ({
      ...prev,
      cpf: formattedValue
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatPhone(value);
    
    setFormData(prev => ({
      ...prev,
      phone: formattedValue
    }));
  };

  const handleProcessNumberChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatProcessNumber(value);
    
    setFormData(prev => ({
      ...prev,
      process_number: formattedValue
    }));
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Clientes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {loading ? (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              </Grid>
            ) : clients.length === 0 ? (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" p={3}>
                  <Typography variant="h6" color="text.secondary">
                    Nenhum cliente encontrado
                  </Typography>
                </Box>
              </Grid>
            ) : (
              clients.map((client) => (
                <Grid item xs={12} sm={6} md={4} key={client.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Foto do Cliente */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Box
                          onClick={() => client.photo_url && handlePhotoZoom(client.photo_url)}
                          sx={{
                            width: 60,
                            height: 75,
                            borderRadius: 1,
                            backgroundImage: `url(${client.photo_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #ddd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: client.photo_url ? 'pointer' : 'default',
                            '&:hover': client.photo_url ? {
                              opacity: 0.8,
                              transform: 'scale(1.05)',
                              transition: 'all 0.2s ease-in-out'
                            } : {}
                          }}
                        >
                          {!client.photo_url && (
                            <PhotoIcon sx={{ fontSize: 20, color: '#999' }} />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Nome do Cliente */}
                      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                        {client.name}
                      </Typography>
                      
                      {/* Informações do Cliente */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>CPF:</strong> {client.cpf ? formatCPF(client.cpf) : '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Senha INSS:</strong> {client.inss_password || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Tipo Processo:</strong> {client.process_type || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Protocolo:</strong> {client.protocol_number || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Nº Processo:</strong> {client.process_number ? formatProcessNumber(client.process_number.replace(/\D/g, '')) : '-'}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    {/* Ações */}
                    <CardActions sx={{ justifyContent: 'center', p: 1 }}>
                      <IconButton size="small" onClick={() => handleViewClient(client)} color="primary">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog(client)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(client.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      </TableContainer>

      {/* Dialog de Visualização (New) */}
      <Dialog open={viewDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Perfil do Cliente</DialogTitle>
        <DialogContent>
          {selectedClient && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Foto do Cliente */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Box
                    onClick={() => selectedClient.photo_url && handlePhotoZoom(selectedClient.photo_url)}
                    sx={{
                      width: 120,
                      height: 160,
                      borderRadius: 1,
                      backgroundImage: `url(${selectedClient.photo_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: selectedClient.photo_url ? 'pointer' : 'default',
                      '&:hover': selectedClient.photo_url ? {
                        opacity: 0.8,
                        transform: 'scale(1.02)',
                        transition: 'all 0.2s ease-in-out'
                      } : {}
                    }}
                  >
                    {!selectedClient.photo_url && (
                      <PhotoIcon sx={{ fontSize: 40, color: '#999' }} />
                    )}
                  </Box>
                  {selectedClient.photo_url && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Clique na foto para ampliar
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12}><Typography variant="h6" gutterBottom>{selectedClient.name}</Typography></Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">CPF</Typography>
                <Typography>{selectedClient.cpf ? formatCPF(selectedClient.cpf) : '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">RG</Typography>
                <Typography>{selectedClient.rg || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Telefone</Typography>
                <Typography>{selectedClient.phone ? formatPhone(selectedClient.phone) : '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography>{selectedClient.email || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Endereço</Typography>
                <Typography>
                  {selectedClient.address || '-'}
                  {selectedClient.city && `, ${selectedClient.city}`}
                  {selectedClient.state && ` - ${selectedClient.state}`}
                  {selectedClient.cep && ` (${selectedClient.cep})`}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Data de Nascimento</Typography>
                <Typography>{formatDate(selectedClient.birth_date)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Data de Cadastro</Typography>
                <Typography>{formatDate(selectedClient.registration_date)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Senha INSS</Typography>
                <Typography>{selectedClient.inss_password || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Indicação</Typography>
                <Typography>{selectedClient.indication || '-'}</Typography>
              </Grid>
              
              <Divider sx={{ my: 2, width: '100%' }} />
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Tipo de Processo</Typography>
                <Typography>{selectedClient.process_type || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Número do Processo</Typography>
                <Typography>{selectedClient.process_number ? formatProcessNumber(selectedClient.process_number.replace(/\D/g, '')) : '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Número do Protocolo</Typography>
                <Typography>{selectedClient.protocol_number || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Nome do Advogado</Typography>
                <Typography>{selectedClient.lawyer_name || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Valor do Contrato</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(selectedClient.contract_value)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição/Criação (Updated) */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Seção de Foto */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 160,
                    borderRadius: 1,
                    backgroundImage: `url(${photoPreview || formData.photo_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: '#f5f5f5',
                    border: '2px dashed #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  {!photoPreview && !formData.photo_url && (
                    <PhotoIcon sx={{ fontSize: 40, color: '#999' }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                    type="file"
                    onChange={handlePhotoChange}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoIcon />}
                      disabled={uploadingPhoto}
                    >
                      Selecionar Foto
                    </Button>
                  </label>
                  {selectedPhoto && (
                    <Button
                      variant="contained"
                      onClick={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? <CircularProgress size={20} /> : 'Enviar Foto'}
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}><Typography variant="h6" gutterBottom>Dados Pessoais</Typography></Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CPF"
                value={formData.cpf}
                onChange={handleCPFChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RG"
                value={formData.rg}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={handlePhoneChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Estado"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Nascimento"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Cadastro"
                type="date"
                value={formData.registration_date}
                onChange={(e) => setFormData({ ...formData, registration_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Senha INSS"
                value={formData.inss_password}
                onChange={(e) => setFormData({ ...formData, inss_password: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Indicação"
                value={formData.indication}
                onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              />
            </Grid>
            
            {/* Dados do Processo */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Dados do Processo
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tipo de Processo"
                value={formData.process_type}
                onChange={(e) => setFormData({ ...formData, process_type: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número do Processo"
                value={formData.process_number}
                onChange={handleProcessNumberChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número do Protocolo"
                value={formData.protocol_number}
                onChange={(e) => setFormData({ ...formData, protocol_number: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Advogado"
                value={formData.lawyer_name}
                onChange={(e) => setFormData({ ...formData, lawyer_name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor do Contrato"
                type="text"
                value={formatCurrencyInput(formData.contract_value)}
                onChange={handleCurrencyChange}
                placeholder="R$ 0,00"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingClient ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Zoom da Foto */}
      <Dialog 
        open={photoZoomDialog} 
        onClose={handleClosePhotoZoom} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box
            sx={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box
              component="img"
              src={zoomedPhoto}
              alt="Foto do cliente ampliada"
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            />
            <IconButton
              onClick={handleClosePhotoZoom}
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Clients; 