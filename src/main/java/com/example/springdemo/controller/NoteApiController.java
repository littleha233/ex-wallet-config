package com.example.springdemo.controller;

import com.example.springdemo.domain.Note;
import com.example.springdemo.service.NoteService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteApiController {
    private final NoteService noteService;

    public NoteApiController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public List<Note> list() {
        return noteService.list();
    }

    @PostMapping
    public Note create(@RequestBody CreateNoteRequest request) {
        return noteService.create(request.title(), request.content());
    }

    public record CreateNoteRequest(String title, String content) {
    }
}
