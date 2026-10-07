package com.lawfirm.brs.mapper;

import com.lawfirm.brs.dto.response.ReviewDTO;
import com.lawfirm.brs.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {LawyerMapper.class, ServiceEntityMapper.class})
public interface ReviewMapper {

    @Mapping(target = "content", source = "contentVi")
    @Mapping(target = "lawyerId", source = "lawyer.id")
    @Mapping(target = "lawyerName", source = "lawyer.nameVi")
    @Mapping(target = "serviceId", source = "service.id")
    @Mapping(target = "serviceName", source = "service.slug")
    ReviewDTO toDTO(Review review);

    @Mapping(target = "content", source = "contentVi")
    @Mapping(target = "lawyerId", source = "lawyer.id")
    @Mapping(target = "lawyerName", source = "lawyer.nameVi")
    @Mapping(target = "serviceId", source = "service.id")
    @Mapping(target = "serviceName", source = "service.slug")
    @Named("withDetails")
    ReviewDTO toDTOWithDetails(Review review);

    List<ReviewDTO> toDTOList(List<Review> reviews);

    List<ReviewDTO> toDTOListWithDetails(List<Review> reviews);
}
