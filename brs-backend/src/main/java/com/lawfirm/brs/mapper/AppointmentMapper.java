package com.lawfirm.brs.mapper;

import com.lawfirm.brs.dto.response.AppointmentDTO;
import com.lawfirm.brs.entity.Appointment;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {LawyerMapper.class, ServiceEntityMapper.class})
public interface AppointmentMapper {

    @Named("appointmentToDTO")
    @Mapping(target = "lawyerId", source = "lawyer.id")
    @Mapping(target = "lawyerName", source = "lawyer.nameVi")
    @Mapping(target = "serviceId", source = "service.id")
    @Mapping(target = "serviceName", source = "service.slug")
    @Mapping(target = "status", expression = "java(appointment.getStatus() != null ? appointment.getStatus().name() : null)")
    @Mapping(target = "meetingType", expression = "java(appointment.getMeetingType() != null ? appointment.getMeetingType().name() : null)")
    @Mapping(target = "clientPhone", source = "clientPhone")
    AppointmentDTO toDTO(Appointment appointment);

    @Named("appointmentToDTOWithDetails")
    @Mapping(target = "lawyerId", source = "lawyer.id")
    @Mapping(target = "lawyerName", source = "lawyer.nameVi")
    @Mapping(target = "serviceId", source = "service.id")
    @Mapping(target = "serviceName", source = "service.slug")
    @Mapping(target = "status", expression = "java(appointment.getStatus() != null ? appointment.getStatus().name() : null)")
    @Mapping(target = "meetingType", expression = "java(appointment.getMeetingType() != null ? appointment.getMeetingType().name() : null)")
    @Mapping(target = "clientPhone", source = "clientPhone")
    @Mapping(target = "includeOtpDetails", constant = "false")
    AppointmentDTO toDTOWithDetails(Appointment appointment);

    /** Convenience helper used by callers that only need the booked client + schedule
     * (calendar view). Drop the OTP/internal fields by routing through {@link #toDTOWithDetails}. */
    @IterableMapping(qualifiedByName = "appointmentToDTOWithDetails")
    List<AppointmentDTO> toDTOListWithDetails(List<Appointment> appointments);

    /** Default list mapping still resolves to the basic DTO. For calendar, prefer {@link #toDTOListWithDetails(List)}. */
    @IterableMapping(qualifiedByName = "appointmentToDTO")
    List<AppointmentDTO> toDTOList(List<Appointment> appointments);
}
