package com.campuscart.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public Map<String, Object> upload(MultipartFile file) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        return result;
    }

    public Map<String, Object> delete(String cloudinaryPublicId) throws IOException {
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().destroy(cloudinaryPublicId, ObjectUtils.emptyMap());
        return result;
    }
}
