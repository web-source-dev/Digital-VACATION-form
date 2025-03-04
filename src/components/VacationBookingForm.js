import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel, 
  Box,
  Typography,
  Alert,
  Container
} from '@mui/material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./VacationBookingForm.css";
import axios from 'axios';

const VacationBookingForm = () => {
  const [formData, setFormData] = useState({
    employeeName: '',
    email: '',
    clinic: '',
    department: '',
    startDate: '',
    endDate: ''
  });
  
  const [employee, setEmployee] = useState(null);
  const [remainingDays, setRemainingDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  
  const clinics = [
    { value: 'clinic1', label: 'Clinic 1' },
    { value: 'clinic2', label: 'Clinic 2' },
    { value: 'clinic3', label: 'Clinic 3' }
  ];

  const departments = [
    { value: 'dept1', label: 'Department 1' },
    { value: 'dept2', label: 'Department 2' },
    { value: 'dept3', label: 'Department 3' }
  ];

  // Get date range for next 2 months
  const today = new Date();
  const twoMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());
  
  const minDate = today.toISOString().split('T')[0];
  const maxDate = twoMonthsFromNow.toISOString().split('T')[0];

  const validateEmployeeAccess = () => {
    if (!employee) {
      setError('Please enter your email address first to verify your details');
      return false;
    }
    
    if (employee.clinic !== formData.clinic) {
      setError(`You are assigned to ${clinics.find(c => c.value === employee.clinic)?.label}. 
        Please select your assigned clinic to proceed.`);
      return false;
    }
    
    if (employee.department !== formData.department) {
      setError(`You are assigned to ${departments.find(d => d.value === employee.department)?.label}. 
        Please select your assigned department to proceed.`);
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    if (formData.email) {
      fetchEmployeeDetails();
    }
  }, [formData.email]);

  useEffect(() => {
    if (formData.clinic && formData.department) {
      fetchUnavailableDates();
    }
  }, [formData.clinic, formData.department]);

  useEffect(() => {
    // Clear clinic and department if they don't match employee's assignment
    if (employee) {
      if (formData.clinic && formData.clinic !== employee.clinic) {
        setFormData(prev => ({
          ...prev,
          clinic: '',
          department: '',
          startDate: '',
          endDate: ''
        }));
        setError(`You can only book vacation for your assigned clinic (${employee.clinic})`);
      }
      if (formData.department && formData.department !== employee.department) {
        setFormData(prev => ({
          ...prev,
          department: '',
          startDate: '',
          endDate: ''
        }));
        setError(`You can only book vacation for your assigned department (${employee.department})`);
      }
    }
  }, [formData.clinic, formData.department, employee]);

  const fetchEmployeeDetails = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/employees/${formData.email}`);
      setEmployee(response.data);
      setRemainingDays(response.data.annualVacationDays - response.data.usedVacationDays);
      
      // Show welcome message with employee details
      setError('');
      setSuccessMessage(`Welcome ${response.data.name}! You have ${response.data.annualVacationDays - response.data.usedVacationDays} vacation days remaining.`);
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Email not found. Please check your email address or contact HR if you believe this is an error.');
      } else {
        setError('Unable to verify your details. Please try again or contact support.');
      }
      setEmployee(null);
    }
  };

  const fetchUnavailableDates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/unavailable-dates`, {
        params: {
          clinic: formData.clinic,
          department: formData.department,
          startDate: minDate,
          endDate: maxDate
        }
      });
      setUnavailableDates(response.data.unavailableDates);
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
      setError('Error fetching unavailable dates');
    }
  };

  const isDateDisabled = (date) => {
    // Convert the input date to YYYY-MM-DD format
    const dateStr = new Date(date).toISOString().split('T')[0];
    return unavailableDates.includes(dateStr);
  };

  const shouldDisableDate = (date) => {
    // Disable dates outside the 2-month range
    if (date < today || date > twoMonthsFromNow) {
      return true;
    }

    // Disable dates that are already booked
    const dateStr = date.toISOString().split('T')[0];
    return unavailableDates.includes(dateStr);
  };

  const handleDateChange = (date, name) => {
    if (!date) return;

    if (name === 'startDate') {
      setFormData(prev => ({
        ...prev,
        startDate: date.toISOString().split('T')[0],
        endDate: ''
      }));
      setError(''); // Clear any existing date-related errors
    } else {
      const start = new Date(formData.startDate);
      if (date < start) {
        setError('The end date must be on or after the start date');
        return;
      }

      if (!isDateRangeValid(formData.startDate, date.toISOString().split('T')[0])) {
        setError(`Some dates in your selected range are already booked. 
          Please check the calendar for available dates.`);
        return;
      }

      setFormData(prev => ({
        ...prev,
        endDate: date.toISOString().split('T')[0]
      }));
      setError('');
    }
  };

  // Function to generate array of dates between two dates
  const getDatesBetween = (startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // Function to check if a date range is valid (no unavailable dates in between)
  const isDateRangeValid = (startDate, endDate) => {
    const dateRange = getDatesBetween(startDate, endDate);
    return !dateRange.some(date => isDateDisabled(date));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate clinic and department selection
    if (name === 'clinic' && employee && value !== employee.clinic) {
      setError(`You can only book vacation for your assigned clinic (${employee.clinic})`);
      return;
    }
    
    if (name === 'department' && employee && value !== employee.department) {
      setError(`You can only book vacation for your assigned department (${employee.department})`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset dates if clinic or department changes
    if (name === 'clinic' || name === 'department') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        startDate: '',
        endDate: ''
      }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateEmployeeAccess()) {
      setLoading(false);
      return;
    }

    try {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        setError('Please ensure your end date comes after your start date');
        return;
      }

      // Calculate total days
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      if (days > remainingDays) {
        setError(`You don't have enough vacation days remaining. 
          You're requesting ${days} days but have ${remainingDays} days available.`);
        return;
      }

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (isDateDisabled(d.toISOString().split('T')[0])) {
          setError(`Your selected date range includes dates that are already booked. 
            Please check the calendar and select available dates.`);
          return;
        }
      }

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/vacation-bookings`,
        {
          ...formData,
          employeeId: employee._id
        }
      );
      
      if (response.status === 201) {
        setSuccessMessage(`Your vacation request has been submitted successfully! 
          You will receive a confirmation email shortly.`);
        // Reset form
        setFormData({
          employeeName: '',
          email: '',
          clinic: '',
          department: '',
          startDate: '',
          endDate: ''
        });
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Unable to submit your vacation request. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{backgroundColor: 'rgba(107, 19, 137, 0.84)', height: '100vh', display: 'flex',flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
      <Typography variant="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'white'}}>
        Vacation Booking Form
      </Typography>
    <Box sx={{ width: "70%", p: 3, backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)'}}>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line'
            }
          }}
        >
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line'
            }
          }}
        >
          {successMessage}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
            sx={{border: '1px solid rgba(135, 20, 173, 0.95)'}}
          fullWidth
          margin="normal"
          label="Employee Name"
          name="employeeName"
          value={formData.employeeName}
          onChange={handleChange}
          required
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          sx={{border: '1px solid rgba(135, 20, 173, 0.95)'}}
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Clinic</InputLabel>
          <Select
            name="clinic"
            value={formData.clinic}
            sx={{border: '1px solid rgba(135, 20, 173, 0.95)'}}
            onChange={handleChange}
            required
            disabled={!employee}
          >
            {clinics.map(clinic => (
              <MenuItem 
                key={clinic.value} 
                value={clinic.value}
                disabled={employee && clinic.value !== employee.clinic}
              >
                {clinic.label}
                {employee && clinic.value !== employee.clinic && " (Not your assigned clinic)"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Department</InputLabel>
          <Select
            name="department"
            value={formData.department}
            sx={{border: '1px solid rgba(135, 20, 173, 0.95)'}}
            onChange={handleChange}
            required
            disabled={!employee || !formData.clinic}
          >
            {departments.map(dept => (
              <MenuItem 
                key={dept.value} 
                value={dept.value}
                disabled={employee && dept.value !== employee.department}
              >
                {dept.label}
                {employee && dept.value !== employee.department && " (Not your assigned department)"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <div style={{ marginBottom: '1rem' }}>
          <DatePicker
            selected={formData.startDate ? new Date(formData.startDate) : null}
            onChange={(date) => handleDateChange(date, 'startDate')}
            dateFormat="yyyy-MM-dd"
            minDate={today}
            maxDate={twoMonthsFromNow}
            placeholderText="Select start date"
            disabled={!formData.clinic || !formData.department}
            excludeDates={unavailableDates.map(date => new Date(date))}
            className="form-control"
            customInput={
              <TextField
              sx={{border: '1px solid rgba(135, 20, 173, 0.95)'}}
                fullWidth
                label="Start Date"
                required
                error={false}
              />
            }
            wrapperClassName="date-picker-wrapper"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <DatePicker
            selected={formData.endDate ? new Date(formData.endDate) : null}
            onChange={(date) => handleDateChange(date, 'endDate')}
            dateFormat="yyyy-MM-dd"
            minDate={formData.startDate ? new Date(formData.startDate) : today}
            maxDate={twoMonthsFromNow}
            placeholderText="Select end date"
            disabled={!formData.startDate}
            excludeDates={unavailableDates.map(date => new Date(date))}
            className="form-control"
            customInput={
              <TextField
              sx={{border: '1px solid rgba(135, 20, 173, 0.95)'}}
                fullWidth
                label="End Date"
                required
                error={false}
              />
            }
            wrapperClassName="date-picker-wrapper"
          />
        </div>

        
        <Button 
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2, backgroundColor: 'rgba(135, 20, 173, 0.85)'}}
          disabled={loading || !formData.clinic || !formData.department}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Box>
    </Container>
  );
};

export default VacationBookingForm; 